async function fetchGraphQL(query, variables = {}) {
  const token = localStorage.getItem('jwt');
  const response = await fetch('https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables
    })
  });
  const result = await response.json();
  return result.data;
}