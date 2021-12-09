# hourplanner
Work scheduler for small and medium companies

## Configuration
Add this to `node_modules/react-scripts/config/webpackDevServer.config.js` in `module.exports.before`:

``` javascript
      // ===
      // Michal Jan's modification to allow POST requests
      // Taken from: https://stackoverflow.com/questions/47442543/how-do-i-get-webpack-dev-server-to-accept-post-requests/47443540
      app.post('*', (req, res) => {
          res.redirect(req.originalUrl);
      });
      // ===
```
