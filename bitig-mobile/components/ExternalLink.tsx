import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import * as Linking from 'expo-linking';
import { Pressable, type PressableProps, Platform } from 'react-native';

export function ExternalLink(
  props: PressableProps & { href: string }
) {
  return (
    <Pressable
      {...props}
      accessibilityRole="link"
      onPress={(e) => {
        props.onPress?.(e);
        if (e.defaultPrevented) return;
        if (Platform.OS !== 'web') {
          WebBrowser.openBrowserAsync(props.href);
        } else {
          Linking.openURL(props.href);
        }
      }}
    />
  );
}
