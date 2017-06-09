module.exports = {
  'unknown-error': {
    message: (args) => `An unknown error was thrown with name: ` +
      `'${args.origCode}'.`,
  },
  'no-controller-found': {
    message: (args) => `No controller found for route: '${args.url}'.`,
  },
  'bad-config-routes': {
    message: `The config/routes.js file in your project MUST export an ` +
      `object. i.e. "module.exports = {'/': '/mycontroller/example'}"`,
  },
  'bad-config-route-redirect': {
    message: (args) => `Each key, value pair in config/routes.js must have a ` +
      `string value. Found an entry: '${args.badKey}' => ` +
      `${JSON.stringify(args.badValue)}`,
  },
  'partials-loop': {
    message: (args) => `Found a partials loop for template: ` +
      `'${args.template}'.`,
  },
  'duplicate-partial-name': {
    message: (args) => `Two partials have been referenced in the same view ` +
      `tree. Please rename the partials or use relative paths for: ` +
      `'${args.partialPath}'.`,
  },
};
