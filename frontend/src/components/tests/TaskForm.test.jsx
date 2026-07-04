import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import TaskForm from '../TaskForm';

jest.mock('../../hooks', () => ({
  useCourses: () => ({
    courses: [{ id: '1', name: 'React 101', code: 'CS101' }]
  })
}));

jest.mock('../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => key, 
    language: 'en'
  })
}));

describe('TaskForm Component', () => {
  let mockOnSubmit;

  beforeEach(() => {
    mockOnSubmit = jest.fn(); 
  });

  afterEach(cleanup);

  test('renders all basic input fields', () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /addNewTask/i })).toBeInTheDocument();
  });

  test('submits correctly', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} />);
  
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Test Task');
  
    const submitButton = screen.getByRole('button', { name: /addNewTask/i });
    await user.click(submitButton);
  
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});