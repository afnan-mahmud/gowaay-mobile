import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Ensure the app name matches MainActivity.java
const componentName = appName || 'GoWaay';

AppRegistry.registerComponent(componentName, () => App);
