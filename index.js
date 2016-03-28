const fetch = require('node-fetch');
const fs = require('fs');

const configData = fs.readFileSync('.github-auth.json', 'utf8');
const config = JSON.parse(configData);

// XXX: Get some nice CLI utils to deal with all this.
const command = process.argv[2];
const args = process.argv.slice(3);

// XXX: Move into utils?
const removeTodoMarkdown = (line) => {
  if (line[0] === ']') {
    return line.substr(1).trim();
  }
  return removeTodoMarkdown(line.substr(1));
};

const apiUrl = (
  `https://api.github.com/repos/${config.username}/todo/contents/todo.md`
);
const userPass = (
  `${config.username}:${config.password}`
);

const getItems = () => (
  fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${new Buffer(userPass).toString('base64')}`,
    },
  }).then(res => res.json()).then(json => {
    return {
      items: new Buffer(json.content, 'base64').toString('ascii').split('\n'),
      sha: json.sha,
    };
  })
);

const setItems = (contents, sha) => {
  fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${new Buffer(userPass).toString('base64')}`,
    },
    body: JSON.stringify({
      message: 'Add a new TODO item',
      content: new Buffer(contents.filter(x => x).join('\n')).toString('base64'),
      sha: sha,
    }),
  }).then(res => {
    return res.text();
  });
};

if (command === 'mark') {
  getItems().then(json => {
    const doneItems = json.items.filter(item => {
      return item.includes('- [x]') || item.includes('-[x]');
    });
    const notDoneItems = json.items.filter(item => {
      return item.includes('- [ ]') || item.includes('-[ ]');
    });
    const newItems = notDoneItems.map((item, index) => {
      if (Number(args[0]) === index + 1) {
        return `- [x] ${removeTodoMarkdown(item)}`;
      }
      return item;
    });
    setItems(newItems.concat(doneItems), json.sha);
  });
} else if (command === 'add') {
  getItems().then(json => {
    const items = json.items;
    items.push(`- [ ] ${args[0]}`);
    setItems(items, json.sha).then(text => console.log(text));
  });
} else {
  getItems().then(json => {
    const items = json.items;
    const notDoneItems = items.filter(item => {
      return item.includes('- [ ]') || item.includes('-[ ]');
    });
    const formattedLines = notDoneItems.map(removeTodoMarkdown);

    if (formattedLines.length) {
      formattedLines.forEach((item, index) => console.log(`${index + 1}. ${item}`));
    } else {
      console.log('Nothing on your todo list! Good job! 🎉');
    }
  });
}
