import type { ProFormItemProps } from '@ant-design/pro-components';
import { ProFormItem } from '@ant-design/pro-components';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { EditorJSProps, EditorJSRef } from '../EditorJS';
import EditorJSComponent from '../EditorJS';

export interface ProFormEditorJSProps extends ProFormItemProps {
  /** Rich text editor props */
  fieldProps?: EditorJSProps;
}

const ProFormEditorJS = forwardRef<EditorJSRef, ProFormEditorJSProps>(
  ({ fieldProps, ...restProps }, ref) => {
    const editorRef = useRef<EditorJSRef>(null);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!editorRef.current) {
          throw new Error('Rich text editor is not initialized');
        }
        return editorRef.current.save();
      },
      clear: async () => {
        await editorRef.current?.clear();
      },
      destroy: async () => {
        await editorRef.current?.destroy();
      },
      getEditor: () => editorRef.current?.getEditor() ?? null,
      setData: (value: string) => editorRef.current?.setData(value),
    }));

    const editorProps: EditorJSProps = { ...fieldProps };

    return (
      <ProFormItem
        {...restProps}
        valuePropName="value"
        trigger="onChange"
        getValueFromEvent={(val: string) => val}
      >
        <EditorJSComponent ref={editorRef} {...editorProps} />
      </ProFormItem>
    );
  },
);

ProFormEditorJS.displayName = 'ProFormEditorJS';

export default ProFormEditorJS;
