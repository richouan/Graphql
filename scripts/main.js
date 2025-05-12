document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    window.location.href = 'login.html';
  }

  document.getElementById('logout').addEventListener('click', function() {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
  });

  try {
    const userInfo = await fetchGraphQL(userQuery);
    console.log('User Info:', userInfo);

    if (userInfo?.user?.[0]) {
      const user = userInfo.user[0];
      userId = user.id;
      
      // Update UI with user info
      document.getElementById('username-display').textContent = user.login;
      document.getElementById('first-name').textContent = user.firstName;
      document.getElementById('last-name').textContent = user.lastName;
      document.getElementById('campus').textContent = user.campus;
      document.getElementById('email').textContent = user.email;
      document.getElementById('created-at').textContent = new Date(user.createdAt).toLocaleString();
      document.getElementById('audit-ratio').textContent = user.auditRatio;
      document.getElementById('address').textContent = user.attrs.arabicAddressStreet;

      // Fetch and display user stats
      await fetchUserStats();
      
      // Create XP chart
      const xpData = await fetchGraphQL(xpProgressQuery);
      createXPChart(xpData);
      
      // Create audit stats chart if audits exist
      if (user.audits && user.audits.length > 0) {
        createAuditStatsChart(user.audits);
      }
      
      // Fetch project data
      await fetchProjectData();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

// Add this at the top level to store userId globally
let userId;

// Update the user info query to include id
const userQuery = `{
  user {
    id
    login
    firstName
    lastName
    campus
    email
    createdAt
    auditRatio
    attrs
    audits {
      closureType
      grade
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

const xpProgressQuery = `{
  allXP: transaction(
    where: {
      _and: [
        { type: { _eq: "xp" } }
        { event: { object: { type: { _in: ["module"] } } } }
      ]
    }
    order_by: { createdAt: asc }
  ) {
    amount
    createdAt
    isBonus
  }
  projectDetails: transaction(
    where: {
      _and: [
        { type: { _eq: "xp" } }
        { object: { type: { _eq: "project" } } }
      ]
    }
  ) {
    amount
    createdAt
    object {
      name
    }
  }
}`;

// Add this helper function to format XP values
function formatXP(xp) {
  if (xp < 1000) {
    return `${xp} Bytes`;
  } else {
    return `${(xp / 1000).toFixed(1)} KB`;
  }
}

// Update the chartData mapping
function createXPChart(data) {
  // Calculate cumulative XP
  let cumulativeXP = 0;
  const chartData = data.allXP.map(t => {
    cumulativeXP += t.amount;
    const date = new Date(t.createdAt);
    
    // Find project name if it's a project date
    const timestamp = date.getTime();
    const projectMatch = data.projectDetails.find(p => 
      new Date(p.createdAt).getTime() === timestamp
    );
    
    return {
      date: date,
      amount: t.amount,
      total: cumulativeXP,
      projectName: projectMatch ? projectMatch.object.name : 'Module XP',
      isBonus: t.isBonus
    };
  });
  
  // Dimensions
  const margin = {top: 40, right: 50, bottom: 50, left: 70};
  const width = 750 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  // Find min and max values for scales
  const minDate = chartData[0].date;
  const maxDate = chartData[chartData.length - 1].date;
  const maxXP = chartData[chartData.length - 1].total;
  
  // Create SVG container
  const svgContent = `
    <svg width="${width + margin.left + margin.right}" height="${height + margin.top + margin.bottom}">
      <defs>
        <linearGradient id="line-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0056b3" />
          <stop offset="100%" stop-color="#00ffff" />
        </linearGradient>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g transform="translate(${margin.left}, ${margin.top})">
        <!-- Grid Lines -->
        ${generateGridLines(width, height, 5, 5)}
        
        <!-- X and Y axes -->
        ${generateAxes(width, height, minDate, maxDate, maxXP)}
        
        <!-- Area under the line -->
        <path d="${generateAreaPath(chartData, width, height, minDate, maxDate, maxXP)}" 
              fill="url(#line-gradient)" 
              opacity="0.1" />
        
        <!-- Line chart -->
        <path d="${generateLinePath(chartData, width, height, minDate, maxDate, maxXP)}"
              stroke="url(#line-gradient)"
              stroke-width="3"
              fill="none"
              filter="url(#glow)"
              class="animated-line" />
        
        <!-- Data points -->
        ${generateDataPoints(chartData, width, height, minDate, maxDate, maxXP)}
      </g>
    </svg>
  `;
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.opacity = 0;
  tooltip.style.background = 'rgba(30, 30, 30, 0.9)';
  tooltip.style.padding = '10px';
  tooltip.style.borderRadius = '6px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.transition = 'all 0.3s ease';
  tooltip.style.zIndex = 1000;
  tooltip.style.backdropFilter = 'blur(4px)';
  
  // Add SVG and tooltip to container
  const container = document.querySelector('.graph-container');
  container.innerHTML = svgContent;
  container.appendChild(tooltip);
  container.style.position = 'relative';
  
  // Add event listeners to points
  const points = container.querySelectorAll('.data-point');
  points.forEach((point, i) => {
    const data = chartData[i];
    
    point.addEventListener('mouseover', function(event) {
      // Enlarge point
      this.setAttribute('r', 8);
      this.setAttribute('stroke-width', 3);
      
      // Show tooltip
      tooltip.style.opacity = 1;
      tooltip.innerHTML = `
        <div style="padding: 8px">
          <div style="font-weight: bold; color: #00ffff">${data.projectName}</div>
          <div style="margin: 5px 0">
            <span style="color: #888">XP Gained:</span> 
            <span style="color: #fff">${formatXP(data.amount)}</span>
          </div>
          <div style="margin: 5px 0">
            <span style="color: #888">Total XP:</span> 
            <span style="color: #fff">${formatXP(data.total)}</span>
          </div>
          <div style="color: #888; font-size: 0.9em">
            ${data.date.toLocaleDateString()}
          </div>
        </div>
      `;
      tooltip.style.left = (event.clientX - container.getBoundingClientRect().left) + 'px';
      tooltip.style.top = (event.clientY - container.getBoundingClientRect().top - 100) + 'px';
    });
    
    point.addEventListener('mouseout', function() {
      // Restore point size
      this.setAttribute('r', 6);
      this.setAttribute('stroke-width', 2);
      
      // Hide tooltip
      tooltip.style.opacity = 0;
    });
  });
  
  // Add animation for line
  const line = container.querySelector('.animated-line');
  const length = line.getTotalLength();
  line.style.strokeDasharray = length;
  line.style.strokeDashoffset = length;
  line.style.animation = 'drawLine 1.5s forwards';
  
  // Add style for animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes drawLine {
      to {
        stroke-dashoffset: 0;
      }
    }
    .data-point {
      transition: r 0.2s, stroke-width 0.2s;
    }
  `;
  document.head.appendChild(style);
  
  // Helper functions for generating SVG elements
  function generateGridLines(width, height, xCount, yCount) {
    let lines = '';
    
    // Vertical grid lines
    for (let i = 0; i <= xCount; i++) {
      const x = (width / xCount) * i;
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#333" stroke-opacity="0.1" />`;
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= yCount; i++) {
      const y = (height / yCount) * i;
      lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#333" stroke-opacity="0.1" />`;
    }
    
    return lines;
  }
  
  function generateAxes(width, height, minDate, maxDate, maxXP) {
    // X-axis (time)
    const xAxis = `<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="#444" />`;
    
    // X-axis ticks
    let xTicks = '';
    for (let i = 0; i <= 5; i++) {
      const x = (width / 5) * i;
      const tickDate = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) * (i / 5));
      const month = tickDate.toLocaleString('default', { month: 'short' });
      const year = tickDate.getFullYear();
      
      xTicks += `
        <line x1="${x}" y1="${height}" x2="${x}" y2="${height + 5}" stroke="#444" />
        <text x="${x}" y="${height + 20}" text-anchor="middle" font-size="12px" fill="#888">
          ${month} ${year}
        </text>
      `;
    }
    
    // Y-axis (XP)
    const yAxis = `<line x1="0" y1="0" x2="0" y2="${height}" stroke="#444" />`;
    
    // Y-axis ticks
    let yTicks = '';
    for (let i = 0; i <= 8; i++) {
      const y = height - (height / 8) * i;
      const tickValue = (maxXP / 8) * i;
      
      yTicks += `
        <line x1="-5" y1="${y}" x2="0" y2="${y}" stroke="#444" />
        <text x="-10" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12px" fill="#888">
          ${formatXP(tickValue)}
        </text>
      `;
    }
    
    return xAxis + xTicks + yAxis + yTicks;
  }
  
  function generateLinePath(data, width, height, minDate, maxDate, maxXP) {
    if (data.length === 0) return '';
    
    // Map data points to SVG coordinates
    let path = `M ${mapX(data[0].date, width, minDate, maxDate)} ${mapY(data[0].total, height, maxXP)}`;
    
    for (let i = 1; i < data.length; i++) {
      const point = data[i];
      path += ` L ${mapX(point.date, width, minDate, maxDate)} ${mapY(point.total, height, maxXP)}`;
    }
    
    return path;
  }
  
  function generateAreaPath(data, width, height, minDate, maxDate, maxXP) {
    if (data.length === 0) return '';
    
    // Start at the bottom left
    let path = `M ${mapX(data[0].date, width, minDate, maxDate)} ${height}`;
    
    // Go up to the first point
    path += ` L ${mapX(data[0].date, width, minDate, maxDate)} ${mapY(data[0].total, height, maxXP)}`;
    
    // Draw the line across all points
    for (let i = 1; i < data.length; i++) {
      const point = data[i];
      path += ` L ${mapX(point.date, width, minDate, maxDate)} ${mapY(point.total, height, maxXP)}`;
    }
    
    // Return to the bottom right and close the path
    path += ` L ${mapX(data[data.length-1].date, width, minDate, maxDate)} ${height} Z`;
    
    return path;
  }
  
  function generateDataPoints(data, width, height, minDate, maxDate, maxXP) {
    return data.map((point, i) => {
      const x = mapX(point.date, width, minDate, maxDate);
      const y = mapY(point.total, height, maxXP);
      const color = point.isBonus ? '#00ffff' : '#007BFF';
      
      return `
        <circle 
          class="data-point" 
          cx="${x}" 
          cy="${y}" 
          r="6" 
          fill="${color}"
          stroke="#1e1e1e"
          stroke-width="2"
          data-index="${i}" 
        />
      `;
    }).join('');
  }
  
  // Mapping functions for coordinates
  function mapX(date, width, minDate, maxDate) {
    const timeRange = maxDate.getTime() - minDate.getTime();
    return ((date.getTime() - minDate.getTime()) / timeRange) * width;
  }
  
  function mapY(value, height, maxValue) {
    return height - (value / maxValue) * height;
  }
}

async function fetchUserStats() {
  const statsQuery = `{
    user {
      level: transactions(
        where: {eventId: {_eq: 41}, type: {_eq: "level"}}
        order_by: {amount: desc}
        limit: 1
      ) {
        amount
      }
      totalXP: transactions_aggregate(
        where: {eventId: {_eq: 41}, type: {_eq: "xp"}}
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }
  }`;

  try {
    const stats = await fetchGraphQL(statsQuery);
    if (stats && stats.user && stats.user.length > 0) {
      const user = stats.user[0];
      const level = user.level[0]?.amount || 0;
      const totalXP = user.totalXP.aggregate.sum.amount || 0;

      // Animate level number
      const levelElement = document.getElementById('user-level');
      const startLevel = parseInt(levelElement.textContent) || 0;
      animateNumber(startLevel, level, 1500, value => {
        levelElement.textContent = Math.floor(value);
      });

      // Animate XP number with KB format
      const xpElement = document.getElementById('total-xp');
      const startXP = parseInt(xpElement.textContent.replace(/[k,XP]/g, '')) || 0;
      animateNumber(startXP, totalXP, 2000, value => {
        xpElement.textContent = formatXP(Math.floor(value));
      });

      // Update progress bar with animation
      const progressBar = document.getElementById('level-progress');
      const nextLevelXP = (level + 1) * 1000;
      const currentLevelXP = level * 1000;
      const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
      
      progressBar.style.transition = 'width 1.5s ease-in-out';
      progressBar.style.width = `${Math.min(100, progress)}%`;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

// Add this helper function for smooth number animations
function animateNumber(start, end, duration, callback) {
  const startTime = performance.now();
  const diff = end - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const currentValue = start + diff * easeOut(progress);

    callback(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
  
async function fetchProjectData() {
  if (!userId) {
    console.error('No user ID available');
    return;
  }

  try {
    // First fetch active group
    const activeGroupQuery = `{
      group_user(
        where: {
          userId: { _eq: ${userId} },
          group: { path: { _like: "/oujda/module/%" } }
        }
        order_by: { createdAt: desc }
        limit: 1
      ) {
        group {
          id
          status
          path
          campus
          createdAt
          updatedAt
          captainId
          event {
            id
            path
            campus
            createdAt
            endAt
          }
          object {
            id
            name
            type
            createdAt
            updatedAt
          }
        }
      }
    }`;

    const groupData = await fetchGraphQL(activeGroupQuery);
    console.log('Group Data:', groupData);
    
    if (groupData?.group_user?.[0]) {
      const group = groupData.group_user[0].group;
      const groupId = group.id;
      
      // Now fetch detailed group info including members
      const dashboardQuery = `{
        group(where: { id: { _eq: ${groupId} } }) {
          id
          status
          path
          campus
          createdAt
          updatedAt
          captainId
          object {
            id
            name
            type
          }
        }
        group_user(where: { groupId: { _eq: ${groupId} } }) {
          user {
            id
            login
            firstName
            lastName
          }
          createdAt
          updatedAt
        }
        progress(where: { groupId: { _eq: ${groupId} } }) {
          id
          grade
          isDone
          createdAt
          updatedAt
        }
        progress(where: { groupId: { _eq: ${groupId} } }) {
          id
          grade
          isDone
          version
          createdAt
          updatedAt
        }
        audit(where: { groupId: { _eq: ${groupId} } }) {
          id
          auditorId
          grade
          createdAt
          updatedAt
          result {
            id
            grade
            createdAt
            updatedAt
          }
        }
      }`;

      const dashboard = await fetchGraphQL(dashboardQuery);
      console.log('Dashboard Data:', dashboard);

      if (dashboard?.group?.[0]) {
        const projectInfo = dashboard.group[0];
        // Update project info
        document.getElementById('project-name').textContent = projectInfo.object.name;
        document.getElementById('project-status').textContent = projectInfo.status;
        document.getElementById('project-start').textContent = new Date(projectInfo.createdAt).toLocaleDateString();

        // Update team members
        const teamGrid = document.getElementById('team-members');
        const members = dashboard.group_user || [];
        
        teamGrid.innerHTML = members.map(member => {
          const isTeamLead = member.user.id === projectInfo.captainId;
          return `
            <div class="team-member ${isTeamLead ? 'team-lead' : ''}">
              <div class="member-info">
                <div class="member-name">${member.user.login || 'Anonymous'}</div>
                ${isTeamLead ? '<div class="team-lead-badge">Team Lead</div>' : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    } else {
      document.getElementById('project-name').textContent = 'No active projects';
      document.getElementById('team-members').innerHTML = '<div class="no-team">No team members</div>';
    }
  } catch (error) {
    console.error('Error fetching project data:', error);
    document.getElementById('project-name').textContent = 'Error loading project';
  }
}

// First, add the query to your existing queries
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

// Update the createAuditStatsChart function
function createAuditStatsChart(audits) {
  console.log('Raw audits:', audits);

  // Filter and count valid audits (removed closureType check)
  const validAudits = audits.filter(audit => audit?.grade != null);

  const stats = validAudits.reduce((acc, audit) => {
    // Changed grade condition to check if it's passing (grade >= 1)
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
    <div class="audit-stats-header">
      <h3>Audit Performance</h3>
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
    </div>

    <div class="audit-chart">
      <div class="progress-ring-wrapper">
        <svg class="progress-ring" width="200" height="200" viewBox="0 0 200 200">
          <circle class="ring-bg" cx="100" cy="100" r="85" />
          <circle class="ring-progress" cx="100" cy="100" r="85"
            stroke-dasharray="${2 * Math.PI * 85}"
            stroke-dashoffset="${calculateOffset(successRatio)}"
          />
          <text x="100" y="90" class="ring-label">Success Rate</text>
          <text x="100" y="120" class="ring-value">${successRatio}%</text>
        </svg>
      </div>
    </div>

    <div class="audited-projects">
      <h4>Audited Projects</h4>
      <div class="projects-grid">
        ${generateGroupCards(validAudits)}
      </div>
    </div>
  `;

  // Add the enhanced styles
  const style = document.createElement('style');
  style.textContent = `
    .audit-stats-container {
      background: linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%);
      border-radius: 16px;
      padding: 30px;
      margin: 20px 0;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.5s ease-out;
    }

    .audit-stats-header h3 {
      color: #00ffff;
      font-size: 1.8em;
      margin-bottom: 25px;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
    }

    .stat-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 255, 255, 0.1);
    }

    .stat-card.success { border-left: 4px solid #00ff00; }
    .stat-card.fail { border-left: 4px solid #ff4444; }

    .stat-icon {
      font-size: 24px;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 255, 255, 0.1);
      border-radius: 12px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .stat-label {
      color: #888;
      font-size: 0.9em;
    }

    .stat-value {
      color: #00ffff;
      font-size: 1.8em;
      font-weight: bold;
    }

    .progress-ring-wrapper {
      display: flex;
      justify-content: center;
      margin: 40px 0;
    }

    .progress-ring {
      transform: rotate(-90deg);
      overflow: visible;
    }

    .ring-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 10;
    }

    .ring-progress {
      fill: none;
      stroke: #00ffff;
      stroke-width: 10;
      stroke-linecap: round;
      transition: stroke-dashoffset 1.5s ease;
      filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.5));
    }

    .ring-label, .ring-value {
      fill: #fff;
      text-anchor: middle;
      transform: rotate(90deg);
    }

    .ring-label {
      font-size: 14px;
      fill: #888;
    }

    .ring-value {
      font-size: 24px;
      font-weight: bold;
      fill: #00ffff;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .group-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
    }

    .group-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 255, 255, 0.1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  document.head.appendChild(style);
  document.querySelector('.audit-stats-section').appendChild(container);
}

// Helper function to calculate circle offset
function calculateOffset(percentage) {
  const circumference = 2 * Math.PI * 90;
  return circumference - (percentage / 100 * circumference);
}

// Update the generateGroupCards function
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
