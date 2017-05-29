class ContenttypeController {
  index() {
    return {
      type: 'html',
      content: 'content-type:html',
    };
  }

  json() {
    return {
      type: 'json',
      content: 'content-type:json',
    };
  }

  custom() {
    return {
      type: 'custom',
      content: 'content-type:json',
    };
  }
}

module.exports = new ContenttypeController();
