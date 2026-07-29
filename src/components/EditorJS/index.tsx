/* eslint-disable import/no-unresolved */

import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { Form, Input, InputNumber, Modal, Space } from 'antd';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const IMAGE_ICON_SVG =
  '<svg class="ck ck-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M6.91 10.54c.26-.23.64-.21.88.03l3.36 3.14 2.23-2.06a.64.64 0 0 1 .87 0l2.52 2.97V4.5H3.2v10.12l3.71-4.08zm10.27-7.51c.6 0 1.09.47 1.09 1.05v11.84c0 .59-.49 1.06-1.09 1.06H2.79c-.6 0-1.09-.47-1.09-1.06V4.08c0-.58.49-1.05 1.1-1.05h14.38zm-5.22 5.56a1.96 1.96 0 1 1 0-3.93 1.96 1.96 0 0 1 0 3.93z"/>' +
  '</svg>';

const VIDEO_ICON_SVG =
  '<svg class="ck ck-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M18.68 3.03c.6 0 1.09.47 1.09 1.05v11.84c0 .59-.49 1.06-1.09 1.06H1.32c-.6 0-1.09-.47-1.09-1.06V4.08c0-.58.49-1.05 1.1-1.05h17.35zM7.5 14.5l7-4.5-7-4.5v9z"/>' +
  '</svg>';

type CKEditorInstance = {
  getData: () => string;
  setData: (data: string) => void;
  enableReadOnlyMode: (source: string) => void;
  disableReadOnlyMode: (source: string) => void;
  destroy: () => Promise<void>;
  execute: (commandName: string, ...args: any[]) => void;
  model: {
    change: (callback: (writer: any) => void) => void;
    insertContent: (content: any) => void;
  };
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
    const videoDimensionsRef = useRef(
      new Map<string, { width: number; height: number }>(),
    );
    const latestValueRef = useRef<string>(value);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [imageForm] = Form.useForm();
    const [videoForm] = Form.useForm();

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

      if (!readOnly) {
        const items = toolbarElement.querySelector('.ck-toolbar__items');
        if (items) {
          const separator = document.createElement('span');
          separator.className = 'ck ck-toolbar__separator';
          items.appendChild(separator);

          const imageBtn = document.createElement('button');
          imageBtn.className = 'ck ck-button ck-off';
          imageBtn.type = 'button';
          imageBtn.tabIndex = -1;
          imageBtn.title = 'Insert image via URL';
          imageBtn.setAttribute('aria-label', 'Insert image via URL');
          imageBtn.innerHTML = IMAGE_ICON_SVG;
          imageBtn.addEventListener('click', () => setImageModalOpen(true));
          items.appendChild(imageBtn);

          const videoBtn = document.createElement('button');
          videoBtn.className = 'ck ck-button ck-off';
          videoBtn.type = 'button';
          videoBtn.tabIndex = -1;
          videoBtn.title = 'Insert video via URL';
          videoBtn.setAttribute('aria-label', 'Insert video via URL');
          videoBtn.innerHTML = VIDEO_ICON_SVG;
          videoBtn.addEventListener('click', () => setVideoModalOpen(true));
          items.appendChild(videoBtn);
        }
      }
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

    const handleInsertImage = () => {
      imageForm.validateFields().then((values) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.model.change((writer: any) => {
          const attrs: Record<string, any> = { src: values.url };
          if (values.width) {
            attrs.resizedWidth = `${values.width}px`;
          }
          if (values.height) {
            attrs.resizedHeight = `${values.height}px`;
          }
          const imageElement = writer.createElement('imageBlock', attrs);
          editor.model.insertContent(imageElement);
        });

        setImageModalOpen(false);
        imageForm.resetFields();
      });
    };

    const handleInsertVideo = () => {
      videoForm.validateFields().then((values) => {
        const editor = editorRef.current;
        if (!editor) return;

        if (values.width || values.height) {
          videoDimensionsRef.current.set(values.url, {
            width: values.width,
            height: values.height,
          });
        }
        editor.execute('mediaEmbed', values.url);

        setVideoModalOpen(false);
        videoForm.resetFields();
      });
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

    const mergedConfig = {
      ...config,
      mediaEmbed: {
        ...config.mediaEmbed,
        previewsInData: true,
        extraProviders: [
          ...(config.mediaEmbed?.extraProviders || []),
          {
            name: 'all',
            url: /./,
            html: (match: RegExpMatchArray) => {
              const urlPart = match.input || '';
              const dims = videoDimensionsRef.current.get(urlPart);
              const src = /^https?:\/\//i.test(urlPart)
                ? urlPart
                : `https://${urlPart}`;
              if (dims?.width || dims?.height) {
                const w = dims.width || 640;
                const h = dims.height || 360;
                return (
                  '<div style="position:relative;">' +
                  `<iframe src="${src}" ` +
                  `style="width:${w}px;height:${h}px;" ` +
                  'frameborder="0" allowfullscreen></iframe>' +
                  '</div>'
                );
              }
              return (
                '<div style="position:relative;width:100%;padding-bottom:56.25%;height:0;overflow:hidden;">' +
                `<iframe src="${src}" ` +
                'style="position:absolute;top:0;left:0;width:100%;height:100%;" ' +
                'frameborder="0" allowfullscreen></iframe>' +
                '</div>'
              );
            },
          },
        ],
      },
    };

    return (
      <div className={`ck-editor-wrapper ${className}`} style={{ ...style }}>
        <div ref={toolbarRef} className="ck-editor-toolbar" />
        <CKEditor
          editor={DecoupledEditor}
          data={value ?? ''}
          disabled={readOnly}
          config={mergedConfig}
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
        <Modal
          title="Insert Image"
          open={imageModalOpen}
          onOk={handleInsertImage}
          onCancel={() => {
            setImageModalOpen(false);
            imageForm.resetFields();
          }}
          destroyOnClose
        >
          <Form form={imageForm} layout="vertical">
            <Form.Item
              name="url"
              label="Image URL"
              rules={[{ required: true, message: 'Please enter image URL' }]}
            >
              <Input placeholder="https://example.com/image.png" />
            </Form.Item>
            <Space>
              <Form.Item name="width" label="Width (px)">
                <InputNumber placeholder="auto" min={1} />
              </Form.Item>
              <Form.Item name="height" label="Height (px)">
                <InputNumber placeholder="auto" min={1} />
              </Form.Item>
            </Space>
          </Form>
        </Modal>
        <Modal
          title="Insert Video"
          open={videoModalOpen}
          onOk={handleInsertVideo}
          onCancel={() => {
            setVideoModalOpen(false);
            videoForm.resetFields();
          }}
          destroyOnClose
        >
          <Form form={videoForm} layout="vertical">
            <Form.Item
              name="url"
              label="Video URL"
              rules={[{ required: true, message: 'Please enter video URL' }]}
            >
              <Input placeholder="https://example.com/video.mp4" />
            </Form.Item>
            <Space>
              <Form.Item name="width" label="Width (px)">
                <InputNumber placeholder="640" min={1} />
              </Form.Item>
              <Form.Item name="height" label="Height (px)">
                <InputNumber placeholder="360" min={1} />
              </Form.Item>
            </Space>
          </Form>
        </Modal>
      </div>
    );
  },
);

EditorJSComponent.displayName = 'EditorJS';

export default EditorJSComponent;
