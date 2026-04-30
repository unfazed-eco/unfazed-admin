/* eslint-disable import/no-unresolved */

import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

type CKEditorInstance = {
  getData: () => string;
  setData: (data: string) => void;
  enableReadOnlyMode: (source: string) => void;
  disableReadOnlyMode: (source: string) => void;
  destroy: () => Promise<void>;
  ui: {
    view: {
      editable?: {
        element?: HTMLElement;
      };
      toolbar?: {
        element?: HTMLElement;
      };
    };
    getEditableElement?: () => HTMLElement | null;
  };
};

export interface EditorJSProps {
  /** HTML content */
  value?: string;
  /** Change callback */
  onChange?: (value: string) => void;
  /** CKEditor configuration */
  config?: Record<string, any>;
  /** Readonly flag */
  readOnly?: boolean;
  /** Minimum editable height */
  height?: number;
  /** Custom wrapper style */
  style?: React.CSSProperties;
  /** Custom wrapper class */
  className?: string;
}

export interface EditorJSRef {
  /** Return current HTML */
  save: () => Promise<string>;
  /** Clear editor content */
  clear: () => Promise<void>;
  /** Destroy editor instance */
  destroy: () => Promise<void>;
  /** Access underlying editor */
  getEditor: () => CKEditorInstance | null;
  /** Manually set content */
  setData: (value: string) => void;
}

const EditorJSComponent = forwardRef<EditorJSRef, EditorJSProps>(
  (
    {
      value = '',
      onChange,
      config = {},
      readOnly = false,
      height,
      style = {},
      className = '',
    },
    ref,
  ) => {
    const editorRef = useRef<CKEditorInstance | null>(null);
    const toolbarRef = useRef<HTMLDivElement | null>(null);
    const latestValueRef = useRef<string>(value);

    const getEditableElement = (editor: CKEditorInstance) =>
      editor.ui.getEditableElement?.() ??
      editor.ui.view.editable?.element ??
      null;

    const applyHeight = (editor: CKEditorInstance | null) => {
      if (!editor || typeof height !== 'number') return;
      const editableElement = getEditableElement(editor);
      if (editableElement) {
        editableElement.style.setProperty(
          'min-height',
          `${height}px`,
          'important',
        );
      }
    };

    const mountToolbar = (editor: CKEditorInstance) => {
      const toolbarElement = editor.ui.view.toolbar?.element;
      const toolbarContainer = toolbarRef.current;
      if (!toolbarElement || !toolbarContainer) return;

      toolbarContainer.replaceChildren(toolbarElement);
    };

    const toggleReadOnly = (
      editor: CKEditorInstance | null,
      isReadOnly: boolean,
    ) => {
      if (!editor) return;
      if (isReadOnly) {
        editor.enableReadOnlyMode('form-readonly');
      } else {
        editor.disableReadOnlyMode('form-readonly');
      }
    };

    useImperativeHandle(ref, () => ({
      save: async () => {
        const editor = editorRef.current;
        if (!editor) {
          throw new Error('Rich text editor is not initialized');
        }
        return editor.getData();
      },
      clear: async () => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.setData('');
        latestValueRef.current = '';
      },
      destroy: async () => {
        const editor = editorRef.current;
        if (editor) {
          await editor.destroy();
          editorRef.current = null;
        }
      },
      getEditor: () => editorRef.current,
      setData: (nextValue: string) => {
        latestValueRef.current = nextValue;
        const editor = editorRef.current;
        if (!editor) return;
        if (editor.getData() !== nextValue) {
          editor.setData(nextValue);
        }
      },
    }));

    useEffect(() => {
      const normalizedValue = value ?? '';
      latestValueRef.current = normalizedValue;
      const editor = editorRef.current;
      if (editor && editor.getData() !== normalizedValue) {
        editor.setData(normalizedValue);
      }
    }, [value]);

    useEffect(() => {
      toggleReadOnly(editorRef.current, readOnly);
    }, [readOnly]);

    useEffect(() => {
      applyHeight(editorRef.current);
    }, [height]);

    return (
      <div className={`ck-editor-wrapper ${className}`} style={{ ...style }}>
        <div ref={toolbarRef} className="ck-editor-toolbar" />
        <CKEditor
          editor={DecoupledEditor}
          data={value ?? ''}
          disabled={readOnly}
          config={config}
          onReady={(editor: CKEditorInstance) => {
            editorRef.current = editor;
            mountToolbar(editor);
            applyHeight(editor);
            toggleReadOnly(editor, readOnly);
            if (editor.getData() !== latestValueRef.current) {
              editor.setData(latestValueRef.current);
            }
          }}
          onChange={(_event: unknown, editor: CKEditorInstance) => {
            const data = editor.getData();
            latestValueRef.current = data;
            onChange?.(data);
          }}
          onBlur={(_event: unknown, editor: CKEditorInstance) => {
            latestValueRef.current = editor.getData();
            onChange?.(latestValueRef.current);
          }}
        />
      </div>
    );
  },
);

EditorJSComponent.displayName = 'EditorJS';

export default EditorJSComponent;
