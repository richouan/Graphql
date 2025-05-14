async function fetchProjectData() {
  if (!userId) {
    console.error('No user ID available');
    return;
  }

  try {
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
        document.getElementById('project-name').textContent = projectInfo.object.name;
        document.getElementById('project-status').textContent = projectInfo.status;
        document.getElementById('project-start').textContent = new Date(projectInfo.createdAt).toLocaleDateString();

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