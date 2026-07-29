import { UploadOutlined } from '@ant-design/icons';
import type { TableProps, UploadFile } from 'antd';
import { Button, Input, Modal, message, Table, Upload } from 'antd';
import React, { useState } from 'react';

const { TextArea } = Input;

interface StringInputModalProps {
  visible: boolean;
  title: string;
  description?: string;
  onOk: (value: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const StringInputModal: React.FC<StringInputModalProps> = ({
  visible,
  title,
  description,
  onOk,
  onCancel,
  loading = false,
}) => {
  const [value, setValue] = useState('');

  const handleOk = () => {
    onOk(value);
    setValue(''); // Clear the input field
  };

  const handleCancel = () => {
    setValue(''); // Clear the input field
    onCancel();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Submit"
      cancelText="Cancel"
    >
      {description && <p style={{ marginBottom: 16 }}>{description}</p>}
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Please enter the required information..."
        rows={4}
        autoFocus
      />
    </Modal>
  );
};

interface FileUploadModalProps {
  visible: boolean;
  title: string;
  description?: string;
  onOk: (files: File[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  visible,
  title,
  description,
  onOk,
  onCancel,
  loading = false,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleOk = () => {
    const files = fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj as File);

    if (files.length === 0) {
      message.warning('Please select at least one file');
      return;
    }

    onOk(files);
    setFileList([]); // Clear the file list
  };

  const handleCancel = () => {
    setFileList([]); // Clear the file list
    onCancel();
  };

  const uploadProps = {
    beforeUpload: () => false, // Prevent automatic upload
    multiple: true,
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    onRemove: (file: UploadFile) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Submit"
      cancelText="Cancel"
    >
      {description && <p style={{ marginBottom: 16 }}>{description}</p>}
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag files to this area to upload
        </p>
        <p className="ant-upload-hint">Support for multiple file upload</p>
      </Upload.Dragger>
    </Modal>
  );
};

interface DataTableModalProps {
  visible: boolean;
  title: string;
  data: any[];
  columns?: TableProps<any>['columns'];
  onClose: () => void;
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  visible,
  title,
  data,
  columns,
  onClose,
}) => {
  // Auto-generate columns from data when none are provided
  const autoColumns = React.useMemo(() => {
    if (columns) return columns;

    if (!data || data.length === 0) return [];

    const firstItem = data[0];
    return Object.keys(firstItem).map((key) => ({
      title: key.charAt(0).toUpperCase() + key.slice(1),
      dataIndex: key,
      key,
      ellipsis: true,
    }));
  }, [data, columns]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={800}
      style={{ top: 20 }}
    >
      <Table
        dataSource={data}
        columns={autoColumns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 'max-content', y: 400 }}
        size="small"
      />
    </Modal>
  );
};
