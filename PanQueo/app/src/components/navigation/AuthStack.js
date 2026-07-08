import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../../lib/theme';

const Stack = createNativeStackNavigator();

export const createAuthStack = (screens, options = {}) => {
  return () => (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: 'slide_from_right',
        ...options,
      }}
    >
      {screens.map(({ name, component }) => (
        <Stack.Screen key={name} name={name} component={component} />
      ))}
    </Stack.Navigator>
  );
};
