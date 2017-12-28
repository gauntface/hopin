const path = require('path');
const proxyquire = require('proxyquire').noCallThru();
const clearRequire = require('clear-require');

describe('Controller Router.route()', function() {
  const exampleController = {
    indexCount: 0,
    demoCount: 0,
    lastType: null,
    index: ({type}) => {
      exampleController.lastType = type;
      exampleController.indexCount++;
    },
    demo: ({type}) => {
      exampleController.lastType = type;
      exampleController.demoCount++;
    },
    reset: () => {
      exampleController.lastType = null;
      exampleController.indexCount = 0;
      exampleController.demoCount = 0;
    },
  };

  const homeController = {
    indexCount: 0,
    lastType: null,
    index: ({type}) => {
      homeController.lastType = type;
      homeController.indexCount++;
    },
    reset: () => {
      homeController.lastType = null;
      homeController.indexCount = 0;
    },
  };

  const errorController = {
    indexCount: 0,
    lastType: null,
    index: ({type}) => {
      errorController.lastType = type;
      errorController.indexCount++;
    },
    reset: () => {
      errorController.lastType = null;
      errorController.indexCount = 0;
    },
  };

  const overrideController = {
    indexCount: 0,
    testCount: 0,
    lastType: null,
    index: ({type}) => {
      overrideController.lastType= type;
      overrideController.indexCount++;
    },
    test: ({type}) => {
      overrideController.lastType = type,
      overrideController.testCount++;
    },
    reset: () => {
      overrideController.lastType = null;
      overrideController.indexCount = 0;
      overrideController.testCount = 0;
    },
  };

  const exampleControllerPath = path.join(__dirname, 'controllers', 'ExampleController.js');
  const homeControllerPath = path.join(__dirname, 'controllers', 'HomeController.js');
  const errorControllerPath = path.join(__dirname, 'controllers', 'ErrorController.js');
  const overrideControllerPath = path.join(__dirname, 'controllers', 'OverrideController.js');

  const proxyquireInputs = {};
  proxyquireInputs['fs-extra'] = {
    exists: (filePath) => {
      if (filePath === exampleControllerPath) {
        return Promise.resolve(true);
      } else if (filePath === homeControllerPath) {
        return Promise.resolve(true);
      } else if (filePath === errorControllerPath) {
        return Promise.resolve(true);
      } else if (filePath === overrideControllerPath) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    },
  };
  proxyquireInputs[exampleControllerPath] = exampleController;
  proxyquireInputs[homeControllerPath] = homeController;
  proxyquireInputs[errorControllerPath] = errorController;
  proxyquireInputs[overrideControllerPath] = overrideController;

  const Router = proxyquire('../../src/controllers/Router', proxyquireInputs);

  beforeEach(function() {
    exampleController.reset();
    homeController.reset();
    overrideController.reset();
  });

  afterEach(function() {
    clearRequire.all();
  });

  it('should handle bad / non-url input', function() {
    const router = new Router({
      relativePath: __dirname,
    });
    const INJECTED_ERROR = 'Expected route to throw error.';
    try {
      router.route({});
      throw new Error(INJECTED_ERROR);
    } catch (err) {
      if (err.message === INJECTED_ERROR) {
        throw err;
      }
    }
  });

  it('should direct to home controller for /', function() {
    const router = new Router({
      relativePath: __dirname,
    });
    return router.route('/')
    .then(() => {
      if (homeController.indexCount !== 1) {
        throw new Error('Expected home controllers index function to be called');
      }
      if (homeController.lastType !== 'html') {
        throw new Error('Expected type to be html');
      }
    });
  });

  it('should direct to controller index by default', function() {
    const router = new Router({
      relativePath: __dirname,
    });
    return router.route('/example')
    .then(() => {
      if (exampleController.indexCount !== 1) {
        throw new Error('Expected example controllers index function to be called');
      }
      if (exampleController.lastType !== 'html') {
        throw new Error('Expected type to be html');
      }
    });
  });

  it('should direct to controller action', function() {
    const router = new Router({
      relativePath: __dirname,
    });
    return router.route('/example/demo')
    .then(() => {
      if (exampleController.demoCount !== 1) {
        throw new Error('Expected example controllers demo function to be called');
      }
      if (exampleController.lastType !== 'html') {
        throw new Error('Expected type to be html');
      }
    });
  });

  it('should direct to controller action with type', function() {
    const router = new Router({
      relativePath: __dirname,
    });
    return router.route('/example/demo.json')
    .then(() => {
      if (exampleController.demoCount !== 1) {
        throw new Error('Expected example controllers demo function to be called');
      }
      if (exampleController.lastType !== 'json') {
        throw new Error('Expected type to be json');
      }
    });
  });

  it('should pass non-existant controller requests to error controller', function() {
    const router = new Router({
      relativePath: __dirname,
    });
    return router.route('/bad-controller')
    .then(() => {
      if (errorController.indexCount !== 1) {
        throw new Error('Expected error controllers index function to be called');
      }
      if (errorController.lastType !== 'html') {
        throw new Error('Expected type to be html');
      }
    });
  });

  /** it('should have no custom routes when no config/routes.js exists', function() {
    // NOTE: This proxyquire'd Router has nothing set up for the
    // require of config/routes.js
    const router = new Router({
      relativePath: __dirname,
    });
    router.customRoutes.should.deep.equal({});
  });**/

  const badInputs = [
    {
      123: [],
    },
    {
      123: false,
    },
    [],
    'a string',
    true,
    false,
    0,
    1,
  ];
  badInputs.forEach((badInput) => {
    it(`should handle bad config/routes.js file - '${JSON.stringify(badInput)}'`, function() {
      let caughtError = null;
      try {
        const proxyInput = {};
        proxyInput[path.join(__dirname, 'config', 'routes.js')] = badInput;

        const BadRouter = proxyquire('../../src/controllers/Router', proxyInput);

        new BadRouter({
          relativePath: __dirname,
        });
        throw new Error('Expected error to be thrown.');
      } catch (err) {
        caughtError = err;
      }

      const HopinError = require('../../src/models/HopinError');
      if (!(caughtError instanceof HopinError)) {
        throw caughtError;
      }
    });
  });

  it('should redirect to custom home controller for /', function() {
    const proxyInput = Object.assign(proxyquireInputs);
    proxyInput[path.join(__dirname, 'config', 'routes.js')] = {
      '/': '/override/test',
    };
    const OverrideRouter = proxyquire('../../src/controllers/Router', proxyInput);

    const router = new OverrideRouter({
      relativePath: __dirname,
    });

    return router.route('/')
    .then(() => {
      if (overrideController.testCount !== 1) {
        throw new Error('Expected override controllers test function to be called');
      }
      if (overrideController.indexCount !== 0) {
        throw new Error('Expected override controllers index function to be zero');
      }
      if (overrideController.lastType !== 'html') {
        throw new Error('Expected type to be html');
      }
    });
  });

  it('should redirect to controller index by default', function() {
    const proxyInput = Object.assign(proxyquireInputs);
    proxyInput[path.join(__dirname, 'config', 'routes.js')] = {
      '/': '/override',
    };
    const OverrideRouter = proxyquire('../../src/controllers/Router', proxyInput);

    const router = new OverrideRouter({
      relativePath: __dirname,
    });

    return router.route('/')
    .then(() => {
      if (overrideController.testCount !== 0) {
        throw new Error('Expected override controllers test function to be 0');
      }
      if (overrideController.indexCount !== 1) {
        throw new Error('Expected override controllers index function to be called');
      }
      if (overrideController.lastType !== 'html') {
        throw new Error('Expected type to be html');
      }
    });
  });

  it('should redirect to controller action', function() {
    const proxyInput = Object.assign(proxyquireInputs);
    proxyInput[path.join(__dirname, 'config', 'routes.js')] = {
      '/example/test': '/override/test',
    };
    const OverrideRouter = proxyquire('../../src/controllers/Router', proxyInput);

    const router = new OverrideRouter({
      relativePath: __dirname,
    });
    return router.route('/example/test')
    .then(() => {
      if (overrideController.testCount !== 1) {
        throw new Error('Expected override controllers test function to be 0');
      }
      if (overrideController.indexCount !== 0) {
        throw new Error('Expected override controllers index function to be called');
      }
      if (overrideController.lastType !== 'html') {
        throw new Error('Expected type to be html');
      }
    });
  });

  it('should redirect to controller action with type', function() {
    const proxyInput = Object.assign(proxyquireInputs);
    proxyInput[path.join(__dirname, 'config', 'routes.js')] = {
      '/example/test.json': '/override/test.json',
    };
    const OverrideRouter = proxyquire('../../src/controllers/Router', proxyInput);

    const router = new OverrideRouter({
      relativePath: __dirname,
    });
    return router.route('/example/test.json')
    .then(() => {
      if (overrideController.testCount !== 1) {
        throw new Error('Expected override controllers test function to be 0');
      }
      if (overrideController.indexCount !== 0) {
        throw new Error('Expected override controllers index function to be called');
      }
      if (overrideController.lastType !== 'json') {
        throw new Error('Expected type to be json');
      }
    });
  });

  it('should redirect with express variables', function() {
    const proxyInput = Object.assign(proxyquireInputs);
    proxyInput[path.join(__dirname, 'config', 'routes.js')] = {
      '/example/:action.:type': '/override/:action.:type',
    };
    const OverrideRouter = proxyquire('../../src/controllers/Router', proxyInput);

    const router = new OverrideRouter({
      relativePath: __dirname,
    });
    return router.route('/example/test.json')
    .then(() => {
      if (overrideController.testCount !== 1) {
        throw new Error('Expected override controllers test function to be 0');
      }
      if (overrideController.indexCount !== 0) {
        throw new Error('Expected override controllers index function to be called');
      }
      if (overrideController.lastType !== 'json') {
        throw new Error('Expected type to be json');
      }
    });
  });
});
