import { render } from '@testing-library/react';
import * as React from 'react';
import ProFormEditorJS from './index';

let mockAttachEditor = true;
let mockCapturedItemProps: any;
let mockCapturedEditorProps: any;
let mockEditorSetData: jest.Mock;

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    ProFormItem: (props: any) => {
      mockCapturedItemProps = props;
      return React.createElement(
        'div',
        { 'data-testid': 'pro-form-item' },
        props.children,
      );
    },
  };
});

jest.mock('../EditorJS', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      mockCapturedEditorProps = props;
      let editorRefApi: any = null;
      if (mockAttachEditor) {
        mockEditorSetData = jest.fn();
        editorRefApi = {
          save: jest.fn(async () => 'saved'),
          clear: jest.fn(async () => {}),
          destroy: jest.fn(async () => {}),
          getEditor: jest.fn(() => ({ id: 'editor' })),
          setData: mockEditorSetData,
        };
      }
      React.useImperativeHandle(ref, () => editorRefApi);
      return React.createElement('div', {
        'data-testid': 'editor-js',
        'data-height': props.height,
      });
    }),
  };
});

describe('ProFormEditorJS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAttachEditor = true;
    mockCapturedItemProps = undefined;
    mockCapturedEditorProps = undefined;
    mockEditorSetData = jest.fn();
  });

  it('renders with default/merged props and forwards imperative api', async () => {
    const ref = React.createRef<any>();
    render(
      <ProFormEditorJS
        ref={ref}
        name="content"
        fieldProps={{ value: '<p>x</p>', height: 360 }}
      />,
    );

    expect(mockCapturedItemProps.valuePropName).toBe('value');
    expect(mockCapturedItemProps.trigger).toBe('onChange');
    expect(mockCapturedItemProps.getValueFromEvent('abc')).toBe('abc');
    expect(mockCapturedEditorProps.height).toBe(360);
    expect(mockCapturedEditorProps.value).toBe('<p>x</p>');

    await expect(ref.current.save()).resolves.toBe('saved');
    await expect(ref.current.clear()).resolves.toBeUndefined();
    await expect(ref.current.destroy()).resolves.toBeUndefined();
    expect(ref.current.getEditor()).toEqual({ id: 'editor' });

    ref.current.setData('<p>manual</p>');
    expect(mockEditorSetData).toHaveBeenCalledWith('<p>manual</p>');
  });

  it('throws when save called before editor initialization', async () => {
    mockAttachEditor = false;
    const ref = React.createRef<any>();
    render(<ProFormEditorJS ref={ref} name="content" />);

    await expect(ref.current.save()).rejects.toThrow(
      'Rich text editor is not initialized',
    );
    expect(ref.current.getEditor()).toBeNull();

    ref.current.setData('<p>x</p>');
  });

  it('does not inject a default editor height', () => {
    render(<ProFormEditorJS name="content" />);

    expect(mockCapturedEditorProps.height).toBeUndefined();
  });
});
