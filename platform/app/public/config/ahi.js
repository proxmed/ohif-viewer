window.config = {
  routerBasename: "/",
  extensions: [],
  modes: [],
  showStudyList: true,
  maxNumRequests: {
    interaction: 200,
    thumbnail: 100,
    prefetch: 50
  },
  dataSources: [{
    namespace: "@ohif/extension-default.dataSourcesModule.dicomweb",
    sourceName: "dicomweb",
    configuration: {
      friendlyName: "AWS HealthImaging",
      name: "aws-healthimaging",
        wadoUriRoot: "https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/10d42ab92271467bb5144861255a04b2",
        qidoRoot: "https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/10d42ab92271467bb5144861255a04b2",
        wadoRoot: "https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/10d42ab92271467bb5144861255a04b2",
        stowRoot: "https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/10d42ab92271467bb5144861255a04b2",
      acceptHeader: ["*/*"],
      qidoSupportsIncludeField: false,
      supportsReject: false,
      imageRendering: "wadors",
      thumbnailRendering: "wadors",
      enableStudyLazyLoad: true,
      supportsFuzzyMatching: false,
      supportsWildcard: false,
      staticWado: false,
      singlepart: "instance,bulkdata,video,pdf",
      requestOptions: {
        headers: {
          "Authorization": "Bearer {{ACCESS_TOKEN}}"
        }
      }
    }
  }],
  oidc: [{
      authority: "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_w8VDcOq68",
      client_id: "7jii73ssbh0tu7j1qsc45lqogl",
    redirect_uri: "/callback",
    response_type: "code",
    scope: "openid profile email",
    post_logout_redirect_uri: "/logout",
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: false
  }]
};
