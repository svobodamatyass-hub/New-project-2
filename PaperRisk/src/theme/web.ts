import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

export const webFocusReset: ViewStyle = Platform.select<ViewStyle>({
  web: {
    outlineColor: 'transparent',
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  default: {},
}) ?? {};
