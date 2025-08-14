import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

import { BackgroundStyleSelector } from '../background-style-selector';

// Mock theme
const theme = createTheme();

// Mock props
const mockProps = {
  selectedStyle: null,
  onStyleSelect: jest.fn(),
  customPrompt: '',
  onCustomPromptChange: jest.fn(),
  disabled: false,
};

const renderWithTheme = (component) => 
  render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );

describe('BackgroundStyleSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders style cards in grid layout', () => {
    renderWithTheme(<BackgroundStyleSelector {...mockProps} />);
    
    // Check if style cards are rendered
    const styleCards = screen.getAllByRole('button');
    expect(styleCards.length).toBeGreaterThan(0);
  });

  it('applies correct CSS classes for grid layout', () => {
    const { container } = renderWithTheme(<BackgroundStyleSelector {...mockProps} />);
    
    // Check if CSS Grid class is applied
    const gridContainer = container.querySelector('.styleGrid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles style selection', () => {
    renderWithTheme(<BackgroundStyleSelector {...mockProps} />);
    
    const firstStyleCard = screen.getAllByRole('button')[0];
    fireEvent.click(firstStyleCard);
    
    expect(mockProps.onStyleSelect).toHaveBeenCalled();
  });

  it('renders custom prompt input', () => {
    renderWithTheme(<BackgroundStyleSelector {...mockProps} />);
    
    const customPromptInput = screen.getByPlaceholderText(/golden sand beach/i);
    expect(customPromptInput).toBeInTheDocument();
  });

  it('handles custom prompt changes', () => {
    renderWithTheme(<BackgroundStyleSelector {...mockProps} />);
    
    const customPromptInput = screen.getByPlaceholderText(/golden sand beach/i);
    fireEvent.change(customPromptInput, { target: { value: 'test prompt' } });
    
    expect(mockProps.onCustomPromptChange).toHaveBeenCalledWith('test prompt');
  });

  it('disables interactions when disabled prop is true', () => {
    const disabledProps = { ...mockProps, disabled: true };
    renderWithTheme(<BackgroundStyleSelector {...disabledProps} />);
    
    const customPromptInput = screen.getByPlaceholderText(/golden sand beach/i);
    expect(customPromptInput).toBeDisabled();
  });

  it('shows selected style with proper styling', () => {
    const selectedProps = {
      ...mockProps,
      selectedStyle: { id: 'tu-nhien', name: 'Tự Nhiên', category: 'nature' }
    };
    
    renderWithTheme(<BackgroundStyleSelector {...selectedProps} />);
    
    // The selected style should have different styling
    const selectedCard = screen.getByText('Tự Nhiên').closest('[role="button"]');
    expect(selectedCard).toBeInTheDocument();
  });
});
