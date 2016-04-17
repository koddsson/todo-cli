const fetch = require('node-fetch');

const getItems = (config) => {
  const apiUrl = (
    `https://api.github.com/repos/${config.username}/todo/contents/todo.md`
  );
  const userPass = (
    `${config.username}:${config.password}`
  );

  return fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${new Buffer(userPass).toString('base64')}`,
    },
  }).then(res => res.json()).then(json => {
    return {
      items: new Buffer(json.content, 'base64').toString('ascii').split('\n'),
      sha: json.sha,
    };
  })
};

const setItems = (config, contents, sha, message) => {
  const apiUrl = (
    `https://api.github.com/repos/${config.username}/todo/contents/todo.md`
  );
  const userPass = (
    `${config.username}:${config.password}`
  );

  return fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${new Buffer(userPass).toString('base64')}`,
    },
    body: JSON.stringify({
      message,
      content: new Buffer(contents.filter(x => x).join('\n')).toString('base64'),
      sha,
    }),
  }).then(res => {
    return res.text();
  });
};

module.exports = (config) => {
  return {
    setItems: setItems.bind(null, config),
    getItems: getItems.bind(null, config),
  };
}
