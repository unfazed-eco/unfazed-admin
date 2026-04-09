import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import ModelAdmin from './index';

jest.mock('@/components', () => {
  const React = require('react');
  return {
    ModelList: ({ onDetail, onModelDescLoaded, modelName }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'model-list' },
        React.createElement('div', { 'data-testid': 'list-name' }, modelName),
        React.createElement(
          'button',
          { type: 'button', onClick: () => onDetail?.({ id: 9, name: 'r1' }) },
          'to-detail',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () =>
              onModelDescLoaded?.({ attrs: { can_edit: true }, fields: {} }),
          },
          'emit-desc',
        ),
      ),
    ModelDetail: ({ modelName, routeLabel, record, onBack }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'model-detail' },
        React.createElement('div', { 'data-testid': 'detail-name' }, modelName),
        React.createElement(
          'div',
          { 'data-testid': 'detail-label' },
          routeLabel,
        ),
        React.createElement(
          'div',
          { 'data-testid': 'detail-record' },
          record?.id,
        ),
        React.createElement(
          'button',
          { type: 'button', onClick: onBack },
          'detail-back',
        ),
      ),
  };
});

describe('ModelAdmin', () => {
  it('shows model name required message when modelName is empty', () => {
    render(<ModelAdmin modelName={''} />);
    expect(screen.getByText('请指定模型名称')).toBeTruthy();
    expect(screen.getByText('Model name is required')).toBeTruthy();
  });

  it('renders list and transitions to detail with back flow', () => {
    const { unmount } = render(
      <ModelAdmin modelName="books" routeLabel="Books" />,
    );

    expect(screen.getByTestId('model-list')).toBeTruthy();
    expect(screen.getByTestId('list-name').textContent).toBe('books');

    fireEvent.click(screen.getByText('to-detail'));
    expect(screen.getByText(/Loading detail/)).toBeTruthy();

    unmount();
    render(<ModelAdmin modelName="books" routeLabel="Books" />);
    fireEvent.click(screen.getByText('emit-desc'));
    fireEvent.click(screen.getByText('to-detail'));

    expect(screen.getByTestId('model-detail')).toBeTruthy();
    expect(screen.getByTestId('detail-name').textContent).toBe('books');
    expect(screen.getByTestId('detail-label').textContent).toBe('Books');
    expect(screen.getByTestId('detail-record').textContent).toBe('9');

    fireEvent.click(screen.getByText('detail-back'));
    expect(screen.getByTestId('model-list')).toBeTruthy();
  });

  it('resets to list view when modelName changes', () => {
    const { rerender } = render(
      <ModelAdmin modelName="books" routeLabel="Books" />,
    );

    fireEvent.click(screen.getByText('emit-desc'));
    fireEvent.click(screen.getByText('to-detail'));
    expect(screen.getByTestId('model-detail')).toBeTruthy();

    rerender(<ModelAdmin modelName="authors" routeLabel="Authors" />);
    expect(screen.getByTestId('model-list')).toBeTruthy();
    expect(screen.getByTestId('list-name').textContent).toBe('authors');
  });
});
