const fs = require('fs');
const program = require('commander');

const configData = fs.readFileSync(`${__dirname}/.github-auth.json`, 'utf8');
const config = JSON.parse(configData);

const api = require('./api')(config);

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

program
  .version('0.0.1')
  .option('-d', '--debug', 'Output debug information');

program
  .command('list')
  .description('Lists up all the items on the todo list')
  .action(function() {
    api.getItems(config).then(json => {
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
  });

program
  .command('add [item]')
  .description('Add a item to the todo list')
  .action(function(item) {
    api.getItems(config).then(json => {
      const items = json.items;
      items.push(`- [ ] ${item}`);
      api.setItems(items, json.sha, config).then(text => {
        if (program.debug) {
          console.log(text);
        }
      });
    });
  });

program
  .command('mark [item]')
  .description('Mark a item as done')
  .action(function(item) {
    api.getItems(config).then(json => {
      const doneItems = json.items.filter(currentItem => {
        return currentItem.includes('- [x]') || currentItem.includes('-[x]');
      });
      const notDoneItems = json.items.filter(currentItem => {
        return currentItem.includes('- [ ]') || currentItem.includes('-[ ]');
      });
      const newItems = notDoneItems.map((currentItem, index) => {
        if (Number(item) === index + 1) {
          return `- [x] ${removeTodoMarkdown(currentItem)}`;
        }
        return currentItem;
      });
      api.setItems(newItems.concat(doneItems), json.sha);
    });
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
