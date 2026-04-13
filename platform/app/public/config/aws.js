/** @type {AppTypes.Config} */

window.config = {
  routerBasename: null,
  extensions: [],
  modes: [],
  showStudyList: true,
  // below flag is for performance reasons, but it might not work for all servers

  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  // filterQueryParam: false,
  defaultDataSourceName: 'dicomweb',

    oidc: [
    {
      authority: 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_w8VDcOq68',
      client_id: '7jii73ssbh0tu7j1qsc45lqogl',
      redirect_uri: '/callback',
      response_type: 'code',
      scope: 'openid profile email',
      post_logout_redirect_uri: '/',
      silent_redirect_uri: '/silent-refresh.html',
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true,
    },
  ],

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'dcmjs DICOMWeb Server',
        name: 'DCM4CHEE',
        // Something here to check build
        wadoUriRoot: 'https://myserver.com/dicomweb',
        qidoRoot: 'https://myserver.com/dicomweb',
        wadoRoot: 'https://myserver.com/dicomweb',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        staticWado: true,
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    console.warn(error.status);

    // Could use services manager here to bring up a dialog/modal if needed.
    console.warn('test, navigate to https://ohif.org/');
  },
};
