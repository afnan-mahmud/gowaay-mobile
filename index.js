import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Must be registered at top-level before AppRegistry so the headless JS
// task can be found when the app is killed/background and a push arrives.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Background notification:', remoteMessage);
});

const componentName = appName || 'GoWaay';

AppRegistry.registerComponent(componentName, () => App);
