import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import JsonFieldEditor from './index';

jest.mock('antd', () => {
  const React = require('react');
  return {
    Button: ({ children, onClick }: any) =>
      React.createElement('button', { type: 'button', onClick }, children),
    Space: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'space' }, children),
    Input: {
      TextArea: ({ value, onChange, readOnly, placeholder, style }: any) =>
        React.createElement('textarea', {
          value,
          onChange,
          readOnly,
          placeholder,
          style,
          'data-testid': 'json-textarea',
        }),
    },
  };
});

describe('JsonFieldEditor', () => {
  it('renders JSON value and validates input changes', () => {
    const onChange = jest.fn();
    render(
      <JsonFieldEditor
        value={{ a: 1 }}
        onChange={onChange}
        placeholder="json-here"
      />,
    );

    const textarea = screen.getByTestId('json-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('"a": 1');
    expect(textarea.placeholder).toBe('json-here');

    fireEvent.change(textarea, { target: { value: '{bad' } });
    expect(onChange).toHaveBeenCalledWith('{bad');
    expect(screen.getByText(/Expected property name/i)).toBeTruthy();
  });

  it('formats and minifies valid json, and handles parse errors', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <JsonFieldEditor value='{"a":1}' onChange={onChange} />,
    );

    fireEvent.click(screen.getByText('Format'));
    expect(onChange).toHaveBeenCalledWith('{\n  "a": 1\n}');

    fireEvent.click(screen.getByText('Minify'));
    expect(onChange).toHaveBeenCalledWith('{"a":1}');

    rerender(<JsonFieldEditor value="{bad" onChange={onChange} />);
    fireEvent.click(screen.getByText('Format'));
    expect(screen.getByText(/Expected property name/i)).toBeTruthy();

    fireEvent.click(screen.getByText('Minify'));
    expect(screen.getByText(/Expected property name/i)).toBeTruthy();
  });

  it('hides actions in readonly mode', () => {
    render(<JsonFieldEditor value='{"a":1}' readonly={true} />);
    expect(screen.queryByText('Format')).toBeNull();
    expect(screen.queryByText('Minify')).toBeNull();
  });
});
