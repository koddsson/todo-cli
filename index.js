const fetch = require('node-fetch');

const USERNAME = 'koddsson';

const removeTodoMarkdown = (line) => {
  if (line[0] === ']') {
    return line.substr(1).trim();
  }
  return removeTodoMarkdown(line.substr(1));
};

fetch(
  `https://api.github.com/repos/${USERNAME}/todo/contents/todo.md\?ref\=master`,
  {
    headers: {
      Accept: 'application/vnd.github.VERSION.raw',
    },
  }
).then(res => res.text())
 .then(text => {
   const lines = text.split('\n');
   const doneItems = lines.filter(line => {
     return line.includes('- [x]') || line.includes('-[x]');
   });
   const notDoneItems = lines.filter(line => {
     return line.includes('- [ ]') || line.includes('-[ ]');
   });

   const formattedLines = notDoneItems.map(removeTodoMarkdown);

   formattedLines.forEach(line => console.log(`- ${line}`));
});
