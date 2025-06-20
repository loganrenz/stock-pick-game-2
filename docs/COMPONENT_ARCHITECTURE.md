# Component Architecture

This document outlines the new component architecture for the Stock Pick Game, following Vue.js best practices and industry standards.

## Directory Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   └── Card.vue
│   ├── layout/          # Layout components
│   │   ├── PageContainer.vue
│   │   └── LoadingSpinner.vue
│   ├── game/            # Game-specific components
│   │   ├── PickCard.vue
│   │   ├── WeekHeader.vue
│   │   ├── Scoreboard.vue
│   │   ├── WinnerBanner.vue
│   │   ├── CurrentWeekSection.vue
│   │   ├── NextWeekSection.vue
│   │   └── HistorySection.vue
│   ├── forms/           # Form components
│   │   ├── PickForm.vue
│   │   └── LoginForm.vue
│   └── index.ts         # Component exports
├── composables/         # Reusable logic
│   ├── useAuth.ts
│   ├── useGame.ts
│   └── index.ts
└── views/               # Page components
    ├── MainView.vue
    ├── HistoryView.vue
    └── ...
```

## Component Categories

### UI Components (`src/components/ui/`)

Reusable, presentational components that are not specific to the game logic.

- **Button.vue**: Configurable button with variants, sizes, and loading states
- **Input.vue**: Form input with validation states and error handling
- **Card.vue**: Container component with header, body, and footer slots

### Layout Components (`src/components/layout/`)

Components that handle page structure and layout.

- **PageContainer.vue**: Consistent page wrapper with max-width and padding
- **LoadingSpinner.vue**: Reusable loading indicator with configurable states

### Game Components (`src/components/game/`)

Components specific to the stock pick game functionality.

- **PickCard.vue**: Displays individual stock picks with prices and returns
- **WeekHeader.vue**: Shows week information with dates and winner status
- **Scoreboard.vue**: Displays user win counts
- **WinnerBanner.vue**: Weekend winner announcement banner
- **CurrentWeekSection.vue**: Complete current week section with picks and forms
- **NextWeekSection.vue**: Next week picks section with visibility controls
- **HistorySection.vue**: Historical weeks display with detailed tables

### Form Components (`src/components/forms/`)

Reusable form components for user interactions.

- **PickForm.vue**: Stock symbol input form with validation
- **LoginForm.vue**: Username/password login form

## Composables (`src/composables/`)

Reusable logic that can be shared across components.

### useAuth.ts

Provides authentication state and methods:

- `isAuthenticated`: Computed authentication status
- `user`: Current user data
- `isAdmin`: Admin status check
- `login()`: Login method
- `logout()`: Logout method
- `checkAuth()`: Authentication verification

### useGame.ts

Provides game-related utilities and computed values:

- `formatDate()`: Date formatting utility
- `formatPrice()`: Price formatting utility
- `formatReturn()`: Return percentage formatting
- `getReturnClass()`: CSS class for return styling
- `isWeekend`: Computed weekend status
- `getBestPick()`: Find best performing pick
- `orderPicksByReturn()`: Sort picks by return
- `isBestPick()`: Check if pick is the best
- `canPickCurrentWeek()`: Check if user can pick

## Best Practices Implemented

### 1. Single Responsibility Principle

Each component has a single, well-defined purpose:

- UI components handle presentation only
- Game components handle specific game logic
- Layout components handle structure
- Form components handle user input

### 2. Composition API

All components use the Composition API with `<script setup>` for:

- Better TypeScript support
- Improved tree-shaking
- Cleaner code organization
- Better performance

### 3. TypeScript Integration

- Proper interface definitions for props
- Type-safe event emissions
- Computed properties with proper typing
- Generic utility functions

### 4. Props Validation

- Required vs optional props clearly defined
- Default values where appropriate
- Type-safe prop interfaces

### 5. Event Handling

- Consistent event naming (`kebab-case`)
- Type-safe event emissions
- Clear parent-child communication

### 6. Styling

- Tailwind CSS for utility-first styling
- Scoped styles where needed
- Consistent design tokens
- Responsive design patterns

### 7. Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly markup
- Focus management

## Usage Examples

### Using UI Components

```vue
<template>
  <Card variant="elevated" padding="lg">
    <template #header>
      <h2>Section Title</h2>
    </template>
    
    <Input
      v-model="value"
      label="Input Label"
      placeholder="Enter value"
      :error="error"
    />
    
    <Button
      @click="handleClick"
      :loading="loading"
      variant="primary"
      size="lg"
    >
      Submit
    </Button>
  </Card>
</template>
```

### Using Composables

```vue
<script setup lang="ts">
import { useAuth, useGame } from '../composables';

const { isAuthenticated, user, login } = useAuth();
const { formatDate, canPickCurrentWeek } = useGame();
</script>
```

### Using Game Components

```vue
<template>
  <CurrentWeekSection
    :current-week="currentWeek"
    :is-authenticated="isAuthenticated"
    :pick-loading="loading"
    :pick-error="error"
    @submit-pick="handleSubmitPick"
    @open-login="openLogin"
  />
</template>
```

## Migration Benefits

### Before Refactoring

- MainView.vue: 667 lines (30KB)
- HistoryView.vue: 433 lines (8.7KB)
- Duplicated logic across components
- Hard to test individual pieces
- Difficult to maintain and extend

### After Refactoring

- MainView.vue: ~200 lines (much cleaner)
- HistoryView.vue: ~80 lines (focused)
- Reusable components across the app
- Easy to test individual components
- Maintainable and extensible architecture

## Testing Strategy

Each component should have:

- Unit tests for props validation
- Event emission tests
- Computed property tests
- Integration tests for complex interactions

## Future Enhancements

1. **Storybook Integration**: Add Storybook for component documentation and testing
2. **Design System**: Create a comprehensive design system with design tokens
3. **Performance**: Implement lazy loading for large components
4. **Internationalization**: Add i18n support for all text content
5. **Theme Support**: Implement dark/light theme switching
