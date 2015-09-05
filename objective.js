/****

running tests from the objectives directory

```
sudo npm install objective -g
objective --once
LOG_LEVEL=off objective --once
```

or (if you've npm installed in your clone)

```
node_modules/.bin/objective --once
```

 - It finds the objective.js (this file) and runs it

 - The objective.js.json then informs the inclusion 
   of the dev plugin, which runs all objectives in 
   the 'testDir' as tests.

***/

objective('Happner Core', function() {});
