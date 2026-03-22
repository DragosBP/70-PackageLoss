import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SlideUpView, FadeInView } from '../../components/animated-views';
import { PressButton } from '../../components/press-button';
import { LoadingIndicator } from '../../components/loading-indicator';
import { ThemedView } from '../../components/themed-view';
import { ThemedText } from '../../components/themed-text';

export default function AnimateDemoScreen() {
  const [showLoading, setShowLoading] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <SlideUpView style={styles.header}>
        <ThemedText type="title">Animații</ThemedText>
        <ThemedText style={styles.subtitle}>
          Efecte subtile dar noticeble
        </ThemedText>
      </SlideUpView>

      {/* Fade In Example */}
      <FadeInView delay={100}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Fade In</ThemedText>
          <ThemedText style={styles.description}>
            Elementele apar în strălucire liniștit
          </ThemedText>
        </ThemedView>
      </FadeInView>

      {/* Slide Up Example */}
      <SlideUpView delay={150}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Slide Up</ThemedText>
          <ThemedText style={styles.description}>
            Elementele se ridică din jos și apar
          </ThemedText>
        </ThemedView>
      </SlideUpView>

      {/* Button Press Example */}
      <FadeInView delay={200}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Press Animation</ThemedText>
          <ThemedText style={styles.description}>
            Butoanele se micșorează ușor la apăsare
          </ThemedText>
          <PressButton
            title="Apasă mă"
            onPress={() => alert('Apăsare animată!')}
            color="#007AFF"
          />
        </ThemedView>
      </FadeInView>

      {/* Loading Indicator Example */}
      <FadeInView delay={250}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Loading Indicator</ThemedText>
          <ThemedText style={styles.description}>
            Spinner animat cu rotație continuă
          </ThemedText>
          {showLoading ? (
            <LoadingIndicator label="Se încarcă..." size="medium" />
          ) : (
            <PressButton
              title="Arată loading"
              onPress={() => setShowLoading(true)}
              color="#34C759"
            />
          )}
          {showLoading && (
            <PressButton
              title="Ascunde loading"
              onPress={() => setShowLoading(false)}
              color="#FF3B30"
            />
          )}
        </ThemedView>
      </FadeInView>

      {/* Usage Guide */}
      <FadeInView delay={300}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Cum să utilizezi</ThemedText>

          <View style={styles.codeBlock}>
            <ThemedText style={styles.code}>
              {'// Fade In\n'}
              {'<FadeInView delay={0}>\n'}
              {'  <Text>Content</Text>\n'}
              {'</FadeInView>'}
            </ThemedText>
          </View>

          <View style={styles.codeBlock}>
            <ThemedText style={styles.code}>
              {'// Slide Up\n'}
              {'<SlideUpView delay={100}>\n'}
              {'  <Text>Content</Text>\n'}
              {'</SlideUpView>'}
            </ThemedText>
          </View>

          <View style={styles.codeBlock}>
            <ThemedText style={styles.code}>
              {'// Button with press anim\n'}
              {'<PressButton\n'}
              {'  title="Click"\n'}
              {'  onPress={handlePress}\n'}
              {'/>'}
            </ThemedText>
          </View>
        </ThemedView>
      </FadeInView>

      {/* Tips */}
      <FadeInView delay={350}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">💡 Tips</ThemedText>
          <ThemedText style={styles.tip}>
            • Folosește <ThemedText style={styles.bold}>delay</ThemedText> pentru
            stagger effect
          </ThemedText>
          <ThemedText style={styles.tip}>
            • <ThemedText style={styles.bold}>SlideUpView</ThemedText> combină
            slide + fade
          </ThemedText>
          <ThemedText style={styles.tip}>
            • Pentru liste, setează delay={'{'}index * 50{'}'}
          </ThemedText>
        </ThemedView>
      </FadeInView>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  tip: {
    fontSize: 13,
    color: '#666',
    marginVertical: 6,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#333',
  },
  spacer: {
    height: 40,
  },
});
