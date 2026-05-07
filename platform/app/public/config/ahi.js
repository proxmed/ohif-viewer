window.config = {
  routerBasename: '/',
  onnxRuntime: {
    executionProviders: ['wasm'],
  },
  extensions: [],
  modes: [],
  showStudyList: true,
  maxNumRequests: {
    interaction: 200,
    thumbnail: 100,
    prefetch: 50,
  },
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'AWS HealthImaging',
        name: 'aws-healthimaging',
        wadoUriRoot: '__AHI_ENDPOINT__',
        qidoRoot: '__AHI_ENDPOINT__',
        wadoRoot: '__AHI_ENDPOINT__',
        stowRoot: '__AHI_ENDPOINT__',
        acceptHeader: ['*/*'],
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        staticWado: false,
        singlepart: 'instance,bulkdata,video,pdf',
        // Authorization header is injected dynamically at request time by
        // userAuthenticationService.getAuthorizationHeader() — no static
        // placeholder needed here.
        requestOptions: {},
      },
    },
  ],
  oidc: [
    {
      authority: '__COGNITO_AUTHORITY__',
      client_id: '__COGNITO_CLIENT_ID__',
      redirect_uri: '/callback',
      response_type: 'code',
      scope: 'openid profile email',
      post_logout_redirect_uri: '/login',
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: false,
    },
  ],
};
