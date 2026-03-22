import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getLocalProfile } from '@/services/profile';

export default function EntryPoint() {
  const [route, setRoute] = useState<'/onboarding' | '/(tabs)' | null>(null);

  useEffect(() => {
    let mounted = true;

    const resolveRoute = async () => {
      const profile = await getLocalProfile();
      if (!mounted) {
        return;
      }

      if (profile && profile.user_id && profile.nickname && profile.pfp_url) {
        setRoute('/(tabs)');
      } else {
        setRoute('/onboarding');
      }
    };

    void resolveRoute();

    return () => {
      mounted = false;
    };
  }, []);

  if (!route) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={route} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});