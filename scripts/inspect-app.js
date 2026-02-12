const app = require('../app');
console.log('app keys:', Object.keys(app).slice(0,20));
console.log('has _router:', !!app._router);
if (app._router && Array.isArray(app._router.stack)) {
  console.log('stack length:', app._router.stack.length);
  app._router.stack.forEach((mw, i) => {
    console.log(i, mw && mw.route ? Object.keys(mw.route.methods).join(',') + ' ' + mw.route.path : (mw.name || mw.handle && mw.handle.name) );
  });
} else {
  console.log('no stack or router');
}
