const app = require('../app');

function listRoutes(stack, prefix = '') {
  stack.forEach((mw) => {
    if (mw.route) {
      const methods = Object.keys(mw.route.methods).join(',');
      console.log(`${methods} ${prefix}${mw.route.path}`);
    } else if (mw.name === 'router' && mw.handle.stack) {
      listRoutes(
        mw.handle.stack,
        prefix +
          (mw.regexp && mw.regexp.source !== '^\\/?$' ? mw.regexp.source.replace(/\\/g, '') : '')
      );
    }
  });
}

if (!app || !app._router) {
  console.log('No router found');
  process.exit(1);
}

listRoutes(app._router.stack);
