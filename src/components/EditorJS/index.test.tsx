import { act, render } from '@testing-library/react';
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
    view: {
      editable: {
        element: { style: {} as any },
      },
    },
  },
};

jest.mock('@ckeditor/ckeditor5-build-classic', () => ({
  __esModule: true,
  default: { name: 'ClassicEditor' },
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
    capturedProps = undefined;
  });

  it('handles editor ready, changes and ref APIs', async () => {
    const ref = React.createRef<any>();
    const onChange = jest.fn();

    const { rerender } = render(
      <EditorJS
        ref={ref}
        value="<p>v1</p>"
        onChange={onChange}
        readOnly={false}
        height={260}
      />,
    );

    expect(mockEditor.setData).toHaveBeenCalled();
    expect(mockEditor.disableReadOnlyMode).toHaveBeenCalledWith(
      'form-readonly',
    );

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
      <EditorJS
        ref={ref}
        value="<p>v2</p>"
        onChange={onChange}
        readOnly={true}
        height={300}
      />,
    );

    expect(mockEditor.enableReadOnlyMode).toHaveBeenCalledWith('form-readonly');
    expect((mockEditor.ui.view.editable.element.style as any).minHeight).toBe(
      '300px',
    );

    await act(async () => {
      await ref.current.destroy();
    });
    expect(mockEditor.destroy).toHaveBeenCalled();
  });

  it('save throws when editor is unavailable', async () => {
    const ref = React.createRef<any>();
    render(<EditorJS ref={ref} value="" />);

    await act(async () => {
      await ref.current.destroy();
    });

    await expect(ref.current.save()).rejects.toThrow(
      'Rich text editor is not initialized',
    );
    expect(ref.current.getEditor()).toBeNull();
  });
});
