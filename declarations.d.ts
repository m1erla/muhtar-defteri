// Metro handles CSS imports on the web target (e.g. leaflet's stylesheet);
// this keeps TypeScript from rejecting the side-effect import.
declare module '*.css';
