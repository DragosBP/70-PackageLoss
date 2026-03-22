# Animații Subtile

Colecție minimalistă de animații pentru a face UI-ul mai "alive" fără să fie distractive.

## 📦 Componente

### **FadeInView**
Fade in opacity la mount
```tsx
import { FadeInView } from '@/components/animated-views';

<FadeInView delay={0}>
  <Text>Content</Text>
</FadeInView>
```

### **SlideUpView**
Slide up + fade în același timp
```tsx
import { SlideUpView } from '@/components/animated-views';

<SlideUpView delay={100}>
  <Text>Content</Text>
</SlideUpView>
```

### **PressButton**
Buton cu scale animation la apăsare
```tsx
import { PressButton } from '@/components/press-button';

<PressButton
  title="Apasă"
  onPress={() => handlePress()}
  loading={isLoading}
  color="#007AFF"
/>
```

### **LoadingIndicator**
Spinner cu rotație continuă
```tsx
import { LoadingIndicator } from '@/components/loading-indicator';

<LoadingIndicator label="Se încarcă..." size="medium" />
```

## 🎯 Exemple Reale

### În CreateRoomForm
```tsx
import { SlideUpView } from '@/components/animated-views';
import CreateRoomForm from '@/components/create-room-form';

<SlideUpView>
  <CreateRoomForm />
</SlideUpView>
```

### Lista cu Stagger
```tsx
import { FadeInView } from '@/components/animated-views';

<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <FadeInView delay={index * 50}>
      <ItemCard item={item} />
    </FadeInView>
  )}
/>
```

### Loading State
```tsx
{loading ? (
  <LoadingIndicator />
) : (
  <FadeInView>
    <Content />
  </FadeInView>
)}
```

## 🎨 Hook-uri

### **useFadeInAnimation**
```tsx
const style = useFadeInAnimation(delay);
```

### **useSlideUpAnimation**
```tsx
const style = useSlideUpAnimation(delay);
```

### **useScaleOnPress**
```tsx
const { animatedStyle, handlePressIn, handlePressOut } = useScaleOnPress();
```

### **useRotateAnimation**
```tsx
const style = useRotateAnimation(duration);
```

## 💡 Best Practices

- **Delay**: Folosește 50-100ms între elemente pentru stagger subtil
- **Duration**: 400ms e standard pentru fade/slide
- **Spring**: Auto-configurat pentru press animations
- **Performance**: Toate animațiile rulează pe native thread

## 🧪 Demo

Vezi `app/(tabs)/animate-demo.tsx` pentru examples interactive!
