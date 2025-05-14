let userId;

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
      
      document.getElementById('username-display').textContent = user.login;
      document.getElementById('first-name').textContent = user.firstName;
      document.getElementById('last-name').textContent = user.lastName;
      document.getElementById('campus').textContent = user.campus;
      document.getElementById('email').textContent = user.email;
      document.getElementById('created-at').textContent = new Date(user.createdAt).toLocaleString();
      document.getElementById('audit-ratio').textContent = user.auditRatio.toFixed(1);
      document.getElementById('address').textContent = user.attrs.addressRegion;

      await fetchUserStats();
      
      const xpData = await fetchGraphQL(xpProgressQuery);
      createXPChart(xpData);
      
      if (user.audits && user.audits.length > 0) {
        createAuditStatsChart(user.audits);
      }
      
      await fetchProjectData();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

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

function formatXP(xp) {
  if (xp < 1000) {
    return `${xp} Bytes`;
  } else {
    return `${(xp / 1000).toFixed(1)} KB`;
  }
}

function animateNumber(start, end, duration, callback) {
  const startTime = performance.now();
  const diff = end - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const currentValue = start + diff * easeOut(progress);

    callback(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
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

      const levelElement = document.getElementById('user-level');
      const startLevel = parseInt(levelElement.textContent) || 0;
      animateNumber(startLevel, level, 1500, value => {
        levelElement.textContent = Math.floor(value);
      });

      const xpElement = document.getElementById('total-xp');
      const startXP = parseInt(xpElement.textContent.replace(/[k,XP]/g, '')) || 0;
      animateNumber(startXP, totalXP, 2000, value => {
        xpElement.textContent = formatXP(Math.floor(value));
      });

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