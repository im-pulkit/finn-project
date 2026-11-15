const { OpenAI } = require('openai')

let client = null

function getClient() {
  if (client) return client
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' })
  return client
}

async function analyzeCompany(ticker, companyName, financials, query) {
  let c = getClient()

  let finContext = ''
  if (financials) {
    finContext = `Current financials for ${companyName} (${ticker}):
Revenue: ₹${financials.revenue} Cr | QoQ: ${pctChange(financials.revenue, financials.revenue_prev_q)}% | YoY: ${pctChange(financials.revenue, financials.revenue_prev_y)}%
EBITDA: ₹${financials.ebitda} Cr | QoQ: ${pctChange(financials.ebitda, financials.ebitda_prev_q)}% | YoY: ${pctChange(financials.ebitda, financials.ebitda_prev_y)}%
PBT: ₹${financials.pbt} Cr | QoQ: ${pctChange(financials.pbt, financials.pbt_prev_q)}% | YoY: ${pctChange(financials.pbt, financials.pbt_prev_y)}%
PAT: ₹${financials.pat} Cr | QoQ: ${pctChange(financials.pat, financials.pat_prev_q)}% | YoY: ${pctChange(financials.pat, financials.pat_prev_y)}%
EBITDA Margin: ${((financials.ebitda / financials.revenue) * 100).toFixed(1)}%
Debt: ₹${financials.debt} Cr | Equity: ₹${financials.equity} Cr | D/E: ${(financials.debt / financials.equity).toFixed(2)}
OCF: ₹${financials.ocf} Cr | FCF: ₹${financials.fcf} Cr
Cash Conversion: ${((financials.ocf / financials.pat) * 100).toFixed(0)}%`
  }

  let sysPrompt = `You are a financial analyst assistant. You analyze Indian listed companies using ONLY the primary data provided to you. Never use your own knowledge about the company. Only analyze what's in the data given.

Be concise, use bullet points. Numbers should use Indian notation (Cr, L Cr). Format as JSON with sections.`

  let userPrompt = `${finContext}

Query: ${query || 'Give a comprehensive analysis'}

Respond in this JSON format:
{
  "business_snapshot": "1-2 line description",
  "financial_snapshot": { "revenue": "...", "ebitda": "...", "pat": "...", "margins": "..." },
  "trajectory": ["point1", "point2", "point3"],
  "balance_sheet": { "debt": "...", "de_ratio": "...", "commentary": "..." },
  "cash_quality": { "ocf": "...", "fcf": "...", "conversion": "...", "commentary": "..." },
  "bull_case": ["point1", "point2"],
  "bear_case": ["point1", "point2"],
  "narrative_vs_numbers": "brief analysis"
}`

  try {
    let resp = await c.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    })

    let txt = resp.choices[0].message.content
    return JSON.parse(txt)
  } catch (err) {
    console.error('llm error:', err.message)
    return buildFallbackAnalysis(companyName, financials)
  }
}

function buildFallbackAnalysis(name, fin) {
  if (!fin) {
    return {
      business_snapshot: `${name} - analysis requires financial data`,
      financial_snapshot: { revenue: 'N/A', ebitda: 'N/A', pat: 'N/A', margins: 'N/A' },
      trajectory: ['Insufficient data for trajectory analysis'],
      balance_sheet: { debt: 'N/A', de_ratio: 'N/A', commentary: 'No data' },
      cash_quality: { ocf: 'N/A', fcf: 'N/A', conversion: 'N/A', commentary: 'No data' },
      bull_case: ['Requires more data'], bear_case: ['Requires more data'],
      narrative_vs_numbers: 'Insufficient data'
    }
  }

  let revGrowth = pctChange(fin.revenue, fin.revenue_prev_y)
  let ebMargin = ((fin.ebitda / fin.revenue) * 100).toFixed(1)
  let patMargin = ((fin.pat / fin.revenue) * 100).toFixed(1)
  let de = (fin.debt / fin.equity).toFixed(2)
  let cashConv = ((fin.ocf / fin.pat) * 100).toFixed(0)

  return {
    business_snapshot: `${name} reported ₹${fin.revenue} Cr revenue in the latest quarter with ${revGrowth}% YoY growth.`,
    financial_snapshot: {
      revenue: `₹${fin.revenue} Cr (${revGrowth > 0 ? '+' : ''}${revGrowth}% YoY)`,
      ebitda: `₹${fin.ebitda} Cr (margin: ${ebMargin}%)`,
      pat: `₹${fin.pat} Cr (margin: ${patMargin}%)`,
      margins: `EBITDA margin ${ebMargin}%, PAT margin ${patMargin}%`
    },
    trajectory: [
      `Revenue growing at ${revGrowth}% YoY`,
      `EBITDA margin at ${ebMargin}% — ${parseFloat(ebMargin) > 20 ? 'healthy' : 'watch for pressure'}`,
      `PAT growth ${pctChange(fin.pat, fin.pat_prev_y)}% YoY`
    ],
    balance_sheet: {
      debt: `₹${fin.debt} Cr`,
      de_ratio: de,
      commentary: parseFloat(de) < 0.5 ? 'Conservative balance sheet' : parseFloat(de) < 1.5 ? 'Moderate leverage' : 'Elevated leverage — watch debt servicing'
    },
    cash_quality: {
      ocf: `₹${fin.ocf} Cr`,
      fcf: `₹${fin.fcf} Cr`,
      conversion: `${cashConv}%`,
      commentary: parseInt(cashConv) > 80 ? 'Strong cash conversion' : parseInt(cashConv) > 50 ? 'Decent cash conversion' : 'Weak cash conversion — profits not turning into cash'
    },
    bull_case: [
      revGrowth > 10 ? `Strong ${revGrowth}% revenue growth` : `Steady revenue trajectory`,
      parseFloat(de) < 0.5 ? 'Clean balance sheet with low debt' : 'Manageable leverage'
    ],
    bear_case: [
      revGrowth < 5 ? 'Slowing growth trajectory' : 'Growth may not sustain at current rates',
      parseInt(cashConv) < 70 ? 'Cash conversion needs improvement' : 'Margins under competitive pressure'
    ],
    narrative_vs_numbers: `Based on the numbers, ${name} shows ${revGrowth > 15 ? 'strong' : revGrowth > 5 ? 'moderate' : 'modest'} growth. EBITDA margin at ${ebMargin}% ${parseFloat(ebMargin) > parseFloat(((fin.ebitda_prev_y / fin.revenue_prev_y) * 100).toFixed(1)) ? 'expanding' : 'under pressure'}. Cash conversion at ${cashConv}% ${parseInt(cashConv) > 80 ? 'validates earnings quality' : 'warrants attention'}.`
  }
}

function pctChange(curr, prev) {
  if (!prev || prev === 0) return 0
  return ((curr - prev) / prev * 100).toFixed(1)
}

module.exports = { analyzeCompany, buildFallbackAnalysis, pctChange }
