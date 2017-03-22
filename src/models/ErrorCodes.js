module.exports = {
  'unknown-error': {
    message: (args) => `An unknown error was thrown with name: ` +
      `'${args.origCode}'.`,
  },
  'no-controller-found': {
    message: (args) => `No controller found for route: '${args.url}'.`,
  },
  'template-not-found': {
    message: (args) => `Template not found: '${args.templatePath}'`,
  },
  'no-relative-path': {
    message: `No 'relativePath' defined in TemplateManager constructor.`,
  },
  'shell-required': {
    message: `A shell value is a required parameter into renderHTML().`,
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
};
