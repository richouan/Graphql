const auditStatsQuery = `{
  user {
    audits {
      closureType
      grade
      createdAt
      group {
        id
        captain {
          login
        }
        object {
          name
        }
        members {
          userLogin
          userAuditRatio
        }
      }
    }
  }
}`;

function createAuditStatsChart(audits) {
  console.log('Raw audits:', audits);

  // Filter and count valid audits
  const validAudits = audits.filter(audit => audit?.grade != null);

  const stats = validAudits.reduce((acc, audit) => {
    // Grade >= 1 z3ma success
    if (audit.grade >= 1) {
      acc.success++;
    } else {
      acc.fail++;
    }
    return acc;
  }, { success: 0, fail: 0 });

  console.log('Calculated stats:', stats);

  const totalAudits = stats.success + stats.fail;
  const successRatio = totalAudits > 0 ? ((stats.success / totalAudits) * 100).toFixed(1) : '0.0';
  const failRatio = totalAudits > 0 ? ((stats.fail / totalAudits) * 100).toFixed(1) : '0.0';

  const container = document.createElement('div');
  container.className = 'audit-stats-container';
  
  container.innerHTML = `
    <div class="project-header">
      <h3>Audit Performance</h3>
    </div>
    
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-info">
          <span class="stat-label">Total Audits</span>
          <span class="stat-value">${totalAudits}</span>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-label">Success Rate</span>
          <span class="stat-value">${successRatio}%</span>
        </div>
      </div>
      <div class="stat-card fail">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
          <span class="stat-label">Fail Rate</span>
          <span class="stat-value">${failRatio}%</span>
        </div>
      </div>
    </div>

    <div class="performance-chart-container">
      <div class="gauge-chart">
        <svg width="300" height="180" viewBox="0 0 300 180">
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ff4444" />
              <stop offset="50%" stop-color="#ffaa00" />
              <stop offset="100%" stop-color="#00cc00" />
            </linearGradient>
            <filter id="gauge-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.3" />
            </filter>
            <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <!-- Background arc -->
          <path 
            d="M 40 140 A 110 110 0 0 1 260 140" 
            stroke="#2a2a2a"
            stroke-width="20"
            fill="none"
            stroke-linecap="round"
          />
          
          <!-- Colored gauge arc -->
          <path 
            d="M 40 140 A 110 110 0 0 1 260 140" 
            stroke="url(#gauge-gradient)"
            stroke-width="20"
            fill="none"
            stroke-linecap="round"
            stroke-dasharray="345.6"
            stroke-dashoffset="${345.6 * (1 - parseFloat(successRatio) / 100)}"
            class="gauge-arc"
          />
          
          <!-- Gauge ticks -->
          ${generateGaugeTicks()}
          
          
          <!-- Labels -->
          <text x="60" y="170" fill="#888888" font-size="14" text-anchor="middle">0%</text>
          <text x="150" y="170" fill="#888888" font-size="14" text-anchor="middle">50%</text>
          <text x="240" y="170" fill="#888888" font-size="14" text-anchor="middle">100%</text>
          
          <!-- Value display -->
          <text x="150" y="90" fill="#ffffff" font-size="24" text-anchor="middle" font-weight="bold">${successRatio}%</text>
          <text x="150" y="115" fill="#888888" font-size="14" text-anchor="middle">Success Rate</text>
        </svg>
      </div>
    </div>

    ${generateGroupCards(validAudits)}
  `;

  setTimeout(() => {
    const gaugeArc = container.querySelector('.gauge-arc');
    const gaugeNeedle = container.querySelector('.gauge-needle');
    
    if (gaugeArc) {
      gaugeArc.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
    }
    
    if (gaugeNeedle) {
      gaugeNeedle.style.transition = 'transform 1.5s ease-in-out';
    }
    
    const successBar = container.querySelector('.success-bar');
    const failBar = container.querySelector('.fail-bar');
    
    if (successBar && failBar) {
      successBar.style.transition = 'width 1.5s ease-in-out';
      failBar.style.transition = 'width 1.5s ease-in-out, x 1.5s ease-in-out';
    }
  }, 100);

  document.querySelector('.audit-stats-section').appendChild(container);
  
  function generateGaugeTicks() {
    let ticks = '';
    const tickCount = 10;
    
    for (let i = 0; i <= tickCount; i++) {
      const angle = -180 + i * (180 / tickCount);
      const x1 = 150 + 100 * Math.cos(angle * Math.PI / 180);
      const y1 = 140 + 100 * Math.sin(angle * Math.PI / 180);
      const x2 = 150 + 110 * Math.cos(angle * Math.PI / 180);
      const y2 = 140 + 110 * Math.sin(angle * Math.PI / 180);
      
      const isMainTick = i === 0 || i === tickCount / 2 || i === tickCount;
      const tickWidth = isMainTick ? 3 : 1;
      
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="${tickWidth}" />`;
    }
    
    return ticks;
  }
  
  function generateAuditHistory(audits) {
    return audits.map(audit => {
      const date = new Date(audit.createdAt).toLocaleDateString();
      const isPassing = audit.grade >= 1;
      const projectName = audit.group?.object?.name || 'Unknown Project';
      
      return `
        <div class="audit-history-item ${isPassing ? 'success' : 'fail'}">
          <div class="audit-history-left">
            <div class="audit-project-name">${projectName}</div>
            <div class="audit-date">${date}</div>
          </div>
          <div class="audit-grade ${isPassing ? 'success' : 'fail'}">
            ${audit.grade.toFixed(1)}%
          </div>
        </div>
      `;
    }).join('');
  }
}

function generateGroupCards(audits) {
  const groupsByLeader = {};
  
  audits.forEach(audit => {
    if (audit?.group?.id && audit?.group?.object?.name && audit.createdAt) {
      const leader = audit.group.captain?.login || 'Unknown';
      if (!groupsByLeader[leader]) {
        groupsByLeader[leader] = [];
      }
      
      groupsByLeader[leader].push({
        id: audit.group.id,
        name: audit.group.object.name,
        members: audit.group.members || [],
        status: audit.grade >= 1 ? 'success' : 'fail',
        grade: audit.grade,
        date: new Date(audit.createdAt).toLocaleDateString()
      });
    }
  });

  // Get only one leader for preview
  const previewLeader = Object.entries(groupsByLeader)[0];
  const remainingLeaders = Object.entries(groupsByLeader).slice(1);
  
  return `
    <div class="preview-section">
      ${previewLeader ? generateLeaderSection(previewLeader[0], previewLeader[1]) : ''}
      ${remainingLeaders.length > 0 ? `
        <button class="view-all-btn" onclick="showAllGroups()">
          View ${remainingLeaders.length} More Leaders
        </button>
      ` : ''}
    </div>

    <div id="groupsModal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h2>All Audited Groups</h2>
          <span class="close-modal" onclick="hideModal()">&times;</span>
        </div>
        <div class="modal-body">
          <div class="modal-grid">
            ${remainingLeaders.map(([leader, groups]) => 
              generateLeaderSection(leader, groups)
            ).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateLeaderSection(leader, groups) {
  return `
    <div class="leader-section">
      <div class="leader-header">
        <h3 class="leader-name">@${leader}</h3>
        <span class="projects-count">${groups.length} projects</span>
      </div>
      <div class="leader-projects">
        ${groups.map(group => `
          <div class="group-card ${group.status}" onclick="toggleGroupDetails(this)">
            <div class="group-summary">
              <div class="group-header">
                <div class="group-title">
                  <h4>${group.name}</h4>
                  <span class="date">${group.date}</span>
                </div>
                <div class="grade-section">
                  <span class="grade-badge ${group.status}">${group.grade.toFixed(1)}%</span>
                  <span class="expand-icon">+</span>
                </div>
              </div>
            </div>
            <div class="group-details hidden">
              <div class="details-section">
                <div class="members-list">
                  ${group.members.map(member => `
                    <div class="member-row">
                      <span class="member-login">${member.userLogin}</span>
                      <span class="member-ratio">${(member.userAuditRatio || 0).toFixed(1)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function toggleGroupDetails(card) {
  const details = card.querySelector('.group-details');
  const icon = card.querySelector('.expand-icon');
  
  details.classList.toggle('hidden');
  if (details.classList.contains('hidden')) {
    icon.textContent = '+';
  } else {
    icon.textContent = '−';
  }
}

function showAllGroups() {
  document.getElementById('groupsModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideModal() {
  document.getElementById('groupsModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
}