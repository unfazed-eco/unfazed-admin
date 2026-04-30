import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import EditorJS from './index';

const React = require('react');

let capturedProps: any;

const mockEditor = {
  getData: jest.fn(() => '<p>init</p>'),
  setData: jest.fn(),
  enableReadOnlyMode: jest.fn(),
  disableReadOnlyMode: jest.fn(),
  destroy: jest.fn().mockResolvedValue(undefined),
  ui: {
    getEditableElement: jest.fn(),
    view: {
      toolbar: {
        element: document.createElement('div'),
      },
      editable: {
        element: { style: {} as any },
      },
    },
  },
};

jest.mock('@ckeditor/ckeditor5-build-decoupled-document', () => ({
  __esModule: true,
  default: { name: 'DecoupledEditor' },
}));

jest.mock('@ckeditor/ckeditor5-react', () => {
  const React = require('react');
  return {
    CKEditor: (props: any) => {
      capturedProps = props;
      React.useEffect(() => {
        props.onReady(mockEditor);
      }, [props]);
      return React.createElement('div', { 'data-testid': 'ck' });
    },
  };
});

describe('EditorJS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEditor.ui.view.editable.element.style = {
      setProperty: jest.fn(),
    } as any;
    mockEditor.ui.getEditableElement.mockReturnValue(
      mockEditor.ui.view.editable.element,
    );
    mockEditor.ui.view.toolbar.element = document.createElement('div');
    capturedProps = undefined;
  });

  it('handles editor ready, changes and ref APIs', async () => {
    const ref = createRef<any>();
    const onChange = jest.fn();

    const { rerender } = render(
      React.createElement(EditorJS, {
        ref,
        value: '<p>v1</p>',
        onChange,
        readOnly: false,
        height: 260,
      }),
    );

    expect(mockEditor.setData).toHaveBeenCalled();
    expect(capturedProps.editor).toEqual({ name: 'DecoupledEditor' });
    expect(mockEditor.disableReadOnlyMode).toHaveBeenCalledWith(
      'form-readonly',
    );
    expect(
      document.querySelector('.ck-editor-toolbar')?.firstElementChild,
    ).toBe(mockEditor.ui.view.toolbar.element);

    capturedProps.onChange({}, { getData: () => '<p>new</p>' });
    capturedProps.onBlur({}, { getData: () => '<p>blur</p>' });
    expect(onChange).toHaveBeenCalledWith('<p>new</p>');
    expect(onChange).toHaveBeenCalledWith('<p>blur</p>');

    await expect(ref.current.save()).resolves.toBe('<p>init</p>');

    await act(async () => {
      await ref.current.clear();
    });
    expect(mockEditor.setData).toHaveBeenCalledWith('');

    ref.current.setData('<p>manual</p>');
    expect(mockEditor.setData).toHaveBeenCalledWith('<p>manual</p>');

    rerender(
      React.createElement(EditorJS, {
        ref,
        value: '<p>v2</p>',
        onChange,
        readOnly: true,
        height: 300,
      }),
    );

    expect(mockEditor.enableReadOnlyMode).toHaveBeenCalledWith('form-readonly');
    expect(
      (mockEditor.ui.view.editable.element.style as any).setProperty,
    ).toHaveBeenCalledWith('min-height', '300px', 'important');

    await act(async () => {
      await ref.current.destroy();
    });
    expect(mockEditor.destroy).toHaveBeenCalled();
  });

  it('save throws when editor is unavailable', async () => {
    const ref = createRef<any>();
    render(React.createElement(EditorJS, { ref, value: '' }));

    await act(async () => {
      await ref.current.destroy();
    });

    await expect(ref.current.save()).rejects.toThrow(
      'Rich text editor is not initialized',
    );
    expect(ref.current.getEditor()).toBeNull();
  });

  it('does not force a default height when height is not provided', () => {
    render(React.createElement(EditorJS, { value: '<p>compact</p>' }));

    expect(
      (mockEditor.ui.view.editable.element.style as any).setProperty,
    ).not.toHaveBeenCalled();
  });

  it('mounts safely when decoupled toolbar is unavailable', () => {
    const toolbarElement = mockEditor.ui.view.toolbar.element;
    mockEditor.ui.view.toolbar.element = undefined as any;

    render(React.createElement(EditorJS, { value: '<p>x</p>' }));

    expect(
      document.querySelector('.ck-editor-toolbar')?.childElementCount,
    ).toBe(0);
    mockEditor.ui.view.toolbar.element = toolbarElement;
  });
});
