const { getDb } = require('./db')

function findRelevantContacts(company, sector, people) {
  let db = getDb()
  let results = []

  let allContacts = db.prepare('SELECT * FROM contacts').all()

  for (let contact of allContacts) {
    let score = 0
    let reasons = []
    let prevCompanies = JSON.parse(contact.prev_companies || '[]')
    let expertise = JSON.parse(contact.expertise || '[]')

    // direct company match
    if (contact.company && company && contact.company.toLowerCase().includes(company.toLowerCase())) {
      score += 10
      reasons.push(`Currently works at ${contact.company}`)
    }

    // previous company match
    for (let pc of prevCompanies) {
      if (company && pc.toLowerCase().includes(company.toLowerCase())) {
        score += 7
        reasons.push(`Previously worked at ${pc}`)
      }
    }

    // sector match
    if (contact.sector && sector) {
      if (contact.sector.toLowerCase() === sector.toLowerCase()) {
        score += 5
        reasons.push(`Works in ${contact.sector} sector`)
      }
    }

    // expertise match - check if any expertise matches the sector or company keywords
    let keywords = [company, sector].filter(Boolean).map(k => k.toLowerCase())
    for (let exp of expertise) {
      for (let kw of keywords) {
        if (exp.toLowerCase().includes(kw.toLowerCase()) || kw.includes(exp.toLowerCase())) {
          score += 3
          reasons.push(`Expertise in ${exp}`)
          break
        }
      }
    }

    // people match (for management changes)
    if (people && people.length > 0) {
      for (let person of people) {
        for (let pc of prevCompanies) {
          if (person.prevCompanies && person.prevCompanies.some(pp => pp.toLowerCase().includes(pc.toLowerCase()))) {
            score += 8
            reasons.push(`Both worked at ${pc}`)
          }
        }
      }
    }

    // relationship strength
    score += contact.strength

    if (score > 3) {
      results.push({
        ...contact,
        prev_companies: prevCompanies,
        expertise: expertise,
        relevanceScore: score,
        reasons: [...new Set(reasons)]
      })
    }
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  return results.slice(0, 5)
}

function searchNetwork(query) {
  let db = getDb()
  let allContacts = db.prepare('SELECT * FROM contacts').all()
  let q = query.toLowerCase()

  let results = allContacts.map(c => {
    let score = 0
    let reasons = []
    let prevCompanies = JSON.parse(c.prev_companies || '[]')
    let expertise = JSON.parse(c.expertise || '[]')

    if (c.name.toLowerCase().includes(q)) { score += 10; reasons.push('Name match') }
    if (c.company && c.company.toLowerCase().includes(q)) { score += 8; reasons.push(`Works at ${c.company}`) }
    if (c.sector && c.sector.toLowerCase().includes(q)) { score += 5; reasons.push(`${c.sector} sector`) }
    if (c.role && c.role.toLowerCase().includes(q)) { score += 4; reasons.push(`Role: ${c.role}`) }

    for (let pc of prevCompanies) {
      if (pc.toLowerCase().includes(q)) { score += 6; reasons.push(`Previously at ${pc}`) }
    }
    for (let exp of expertise) {
      if (exp.toLowerCase().includes(q)) { score += 5; reasons.push(`Expert in ${exp}`) }
    }
    if (c.notes && c.notes.toLowerCase().includes(q)) { score += 2; reasons.push('Mentioned in notes') }

    return { ...c, prev_companies: prevCompanies, expertise, relevanceScore: score, reasons: [...new Set(reasons)] }
  }).filter(c => c.relevanceScore > 0)

  results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  return results
}

function getNetworkStats() {
  let db = getDb()
  let contacts = db.prepare('SELECT * FROM contacts').all()
  
  let sectors = {}
  let companies = new Set()
  let staleContacts = []
  let now = new Date()

  for (let c of contacts) {
    if (c.sector) sectors[c.sector] = (sectors[c.sector] || 0) + 1
    if (c.company) companies.add(c.company)
    let prevComps = JSON.parse(c.prev_companies || '[]')
    prevComps.forEach(pc => companies.add(pc))

    let lastContact = new Date(c.last_contact)
    let daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24))
    if (daysSince > 90) {
      staleContacts.push({ ...c, daysSince, prev_companies: prevComps })
    }
  }

  return {
    totalContacts: contacts.length,
    sectors,
    companiesReached: companies.size,
    staleContacts: staleContacts.sort((a, b) => b.daysSince - a.daysSince)
  }
}

function getReconnectSuggestions(announcements) {
  let db = getDb()
  let contacts = db.prepare('SELECT * FROM contacts').all()
  let suggestions = []

  for (let ann of announcements) {
    let relevant = findRelevantContacts(ann.company, null, null)
    for (let c of relevant) {
      let lastContact = new Date(c.last_contact)
      let daysSince = Math.floor((new Date() - lastContact) / (1000 * 60 * 60 * 24))
      if (daysSince > 60) {
        suggestions.push({
          contact: c,
          announcement: ann,
          daysSince,
          reason: `${ann.company} just ${ann.category === 'results' ? 'reported results' : ann.category === 'M&A' ? 'announced an acquisition' : 'filed an update'} — natural reason to reconnect with ${c.name}`
        })
      }
    }
  }

  return suggestions.slice(0, 5)
}

module.exports = { findRelevantContacts, searchNetwork, getNetworkStats, getReconnectSuggestions }
