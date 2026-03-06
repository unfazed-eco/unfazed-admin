import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Modal, Spin, Tabs } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { deleteModelData, getModelInlines } from '@/services/api';
import BackRelationAddModal from './BackRelationAddModal';
import BackRelationSelectionModal from './BackRelationSelectionModal';
import { useInlineTabRenderer } from './InlineTabRenderer';
import M2MSelectionModal from './M2MSelectionModal';
import MainFormTab from './MainFormTab';
import type {
  InlineActionRefsMap,
  ModalVisibilityState,
  ModelDetailProps,
} from './types';
import { useInlineOperations } from './useInlineOperations';
import { capitalizeFirstLetter } from './utils';

const ModelDetail: React.FC<ModelDetailProps> = ({
  modelName,
  routeLabel,
  modelDesc,
  record,
  onBack,
}) => {
  const formRef = useRef<ProFormInstance>(null!);

  // Check if create mode
  const isCreateMode = record.id === -1;
  const [hasMainDataSaved, _setHasMainDataSaved] = useState(!isCreateMode);

  // Check if editing is allowed
  const canEdit = modelDesc.attrs.can_edit !== false;

  // Use inline operations hook
  const {
    contextHolder,
    messageApi,
    editingKeys,
    loadedTabs,
    markTabLoaded,
    handleInlineAction,
    handleInlineSave,
    handleInlineDelete,
    handleM2MAdd,
    handleM2MRemove,
    handleBackRelationLink,
    handleBackRelationUnlink,
    addInlineRecord,
  } = useInlineOperations({ mainRecord: record });

  // State management
  const [activeTab, setActiveTab] = useState('main');
  const [inlineDescs, setInlineDescs] = useState<Record<string, any>>({});
  const [m2mModalVisible, setM2MModalVisible] = useState<ModalVisibilityState>(
    {},
  );
  const [backRelationModalVisible, setBackRelationModalVisible] =
    useState<ModalVisibilityState>({});
  const [backRelationAddModalVisible, setBackRelationAddModalVisible] =
    useState<ModalVisibilityState>({});
  const [linkLoading, setLinkLoading] = useState(false);
  // Global loading state for inline operations
  const [operationLoading, setOperationLoading] = useState(false);
  // Action refs for inline tables to enable reload
  const inlineActionRefs = useRef<InlineActionRefsMap>({});

  // Use inline tab renderer hook
  const { renderInlineComponent, debouncedReload } = useInlineTabRenderer({
    record,
    inlineDescs,
    loadedTabs,
    editingKeys,
    handleInlineAction,
    handleInlineSave,
    handleInlineDelete,
    handleM2MRemove,
    handleBackRelationUnlink,
    addInlineRecord,
    setM2MModalVisible,
    setBackRelationModalVisible,
    setBackRelationAddModalVisible,
    setOperationLoading,
    inlineActionRefs,
  });

  // Load inline model data
  const { loading: detailLoading } = useRequest(
    async () => {
      return await getModelInlines({
        name: modelName,
        data: record,
      });
    },
    {
      manual: false,
      onSuccess: (resp: any) => {
        if (formRef.current && record) {
          formRef.current.setFieldsValue(record);
        }
        setInlineDescs(resp || {});
      },
    },
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (key: string) => {
      if (key !== 'main' && !hasMainDataSaved) {
        messageApi.warning(
          'Please save the main data first before accessing related data',
        );
        return;
      }

      setActiveTab(key);

      // Mark tab as loaded (CommonProTable's onRequest will handle data fetching)
      if (key !== 'main' && !loadedTabs.has(key)) {
        markTabLoaded(key);
      }
    },
    [loadedTabs, hasMainDataSaved, messageApi, markTabLoaded],
  );

  // Delete main record
  const handleDelete = async () => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this record?',
      onOk: async () => {
        try {
          const response = await deleteModelData({
            name: modelName,
            data: record,
          });

          if (response?.code === 0) {
            messageApi.success('Deleted successfully');
            onBack?.();
          } else {
            messageApi.error(response?.message || 'Delete failed');
          }
        } catch (_error) {
          messageApi.error('Delete failed');
        }
      },
    });
  };

  if (detailLoading || !modelDesc) {
    return <div>Loading...</div>;
  }

  // Prepare tab items
  const tabItems = [
    {
      key: 'main',
      label: 'Main',
      children: (
        <MainFormTab
          modelName={modelName}
          modelDesc={modelDesc}
          record={record}
          formRef={formRef}
          canEdit={canEdit}
          isCreateMode={isCreateMode}
          messageApi={messageApi}
          onBack={onBack}
        />
      ),
    },
    // Only show inline tabs when main data is saved
    ...(hasMainDataSaved
      ? Object.keys(inlineDescs).map((inlineName) => ({
          key: inlineName,
          label:
            inlineDescs[inlineName]?.attrs?.label ||
            capitalizeFirstLetter(inlineName),
          children: renderInlineComponent(inlineName),
        }))
      : []),
  ];

  return (
    <PageContainer
      header={{
        title: isCreateMode
          ? `Create New ${routeLabel || modelName}`
          : `${routeLabel || modelName} Detail`,
        breadcrumb: {},
        extra: [
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={onBack}>
            Back
          </Button>,
          modelDesc.attrs.can_delete &&
            !isCreateMode &&
            activeTab === 'main' && (
              <Button
                key="delete"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            ),
        ],
      }}
    >
      {contextHolder}

      <Spin spinning={operationLoading} tip="Processing...">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />
      </Spin>

      {/* M2M relation selection modals */}
      {Object.entries(m2mModalVisible).map(([inlineName, visible]) => {
        if (!visible || !inlineDescs[inlineName]) return null;

        const inlineDesc = inlineDescs[inlineName];
        const relation = inlineDesc.relation;

        return (
          <M2MSelectionModal
            key={inlineName}
            visible={visible}
            title={inlineDesc.attrs?.verbose_name || inlineName}
            modelDesc={inlineDesc}
            relation={relation}
            mainRecordId={record[relation.through.source_field]}
            onCancel={() => {
              setM2MModalVisible((prev) => ({ ...prev, [inlineName]: false }));
            }}
            onOk={async (
              newSelectedIds,
              _selectedRecords,
              initialSelectedIds,
            ) => {
              try {
                const addedIds = newSelectedIds.filter(
                  (id) => !initialSelectedIds.includes(id),
                );
                const removedIds = initialSelectedIds.filter(
                  (id) => !newSelectedIds.includes(id),
                );

                // Important: removed records are not part of the modal's selectedRows.
                // Use IDs directly to ensure unlink works even if user never visited that page.
                if (addedIds.length > 0) {
                  await handleM2MAdd(inlineName, inlineDesc, addedIds);
                }

                if (removedIds.length > 0) {
                  await handleM2MRemove(inlineName, inlineDesc, removedIds);
                }

                // Reload the inline table
                debouncedReload(inlineName);
              } catch (error) {
                console.error('M2M operation error:', error);
                messageApi.error('Operation failed');
              }
            }}
          />
        );
      })}

      {/* Back relation (bk_fk/bk_o2o) selection modals */}
      {Object.entries(backRelationModalVisible).map(([inlineName, visible]) => {
        if (!visible || !inlineDescs[inlineName]) return null;

        const inlineDesc = inlineDescs[inlineName];
        const relation = inlineDesc.relation;
        const isBkO2O = relation?.relation === 'bk_o2o';

        return (
          <BackRelationSelectionModal
            key={inlineName}
            visible={visible}
            title={inlineDesc.attrs?.label || inlineName}
            modelName={inlineName}
            modelDesc={inlineDesc}
            relation={relation}
            mainRecordId={record.id}
            isSingleSelect={isBkO2O}
            loading={linkLoading}
            onCancel={() => {
              setBackRelationModalVisible((prev) => ({
                ...prev,
                [inlineName]: false,
              }));
            }}
            onLink={async (selectedRecords, unlinkedRecords) => {
              setLinkLoading(true);
              try {
                // IMPORTANT: For O2O relations, must unlink first, then link
                // Handle unlinked records first (set FK to negative of record's own ID)
                if (unlinkedRecords.length > 0) {
                  for (const unlinkRecord of unlinkedRecords) {
                    await handleBackRelationUnlink(
                      inlineName,
                      inlineDesc,
                      unlinkRecord,
                    );
                  }
                }

                // Handle newly linked records after unlinking
                if (selectedRecords.length > 0) {
                  await handleBackRelationLink(
                    inlineName,
                    inlineDesc,
                    selectedRecords,
                  );
                }

                setBackRelationModalVisible((prev) => ({
                  ...prev,
                  [inlineName]: false,
                }));

                // Reload the inline table after linking/unlinking
                debouncedReload(inlineName);
              } finally {
                setLinkLoading(false);
              }
            }}
          />
        );
      })}

      {/* Back relation (bk_fk/bk_o2o) add modals - for creating new related records */}
      {Object.entries(backRelationAddModalVisible).map(
        ([inlineName, visible]) => {
          if (!visible || !inlineDescs[inlineName]) return null;

          const inlineDesc = inlineDescs[inlineName];
          const relation = inlineDesc.relation;

          return (
            <BackRelationAddModal
              key={`add-${inlineName}`}
              visible={visible}
              inlineName={inlineName}
              inlineDesc={inlineDesc}
              relation={relation}
              mainRecord={record}
              messageApi={messageApi}
              onClose={() => {
                setBackRelationAddModalVisible((prev) => ({
                  ...prev,
                  [inlineName]: false,
                }));
              }}
              onSuccess={() => {
                debouncedReload(inlineName);
              }}
            />
          );
        },
      )}
    </PageContainer>
  );
};

export default ModelDetail;
