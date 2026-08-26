// IMPORTANT: react-native-gesture-handler MUST be the very first import on Android
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import App from "./App";
registerRootComponent(App);
