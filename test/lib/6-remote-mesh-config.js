module.exports = {
  name: 'test_6',
  version: '1.0.0',
  dataLayer: {
    port: 3111,
    secure: true,
    adminPassword: 'password'
  },
  endpoints: {},
  modules: {
    component: {
      path: __dirname + '/6-testMeshComponent',
      create: {
        type: "sync",
        parameters: []
      }
    }
  },
  components: {
    data: {},
    'component': {
      moduleName: "component",
      schema: {
        "exclusive": false
      }
    }
  }
};
