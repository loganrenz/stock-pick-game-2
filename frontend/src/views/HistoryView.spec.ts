import { render } from '@testing-library/vue';
import HistoryView from './HistoryView.vue';
import { describe, it, expect } from 'vitest';
import { createPinia } from 'pinia';

describe('HistoryView', () => {
  it('renders correctly visually', async () => {
    const { container } = render(HistoryView, {
      global: {
        plugins: [createPinia()]
      }
    });
    expect(container).toMatchSnapshot();
  });
}); 