import React, { useEffect, useState } from 'react';
import { ModelDetail, ModelList } from '@/components';

interface ModelAdminProps {
  modelName: string;
  routeLabel?: string;
}

const ModelAdmin: React.FC<ModelAdminProps> = ({ modelName, routeLabel }) => {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [currentRecord, setCurrentRecord] = useState<Record<
    string,
    any
  > | null>(null);
  const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(
    null,
  );

  // Reset component state when the model name changes.
  useEffect(() => {
    console.log('ModelAdmin: modelName changed to', modelName);
    setCurrentView('list');
    setCurrentRecord(null);
    setModelDesc(null);
  }, [modelName]);

  // Handle the detail action.
  const handleDetail = (record: Record<string, any>) => {
    setCurrentRecord(record);
    setCurrentView('detail');
  };

  // Return to the list view.
  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentRecord(null);
  };

  // Handle model description loading.
  const handleModelDescLoaded = (loadedModelDesc: API.AdminSerializeModel) => {
    setModelDesc(loadedModelDesc);
  };

  if (!modelName) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Please specify a model name</h2>
        <p>Model name is required</p>
      </div>
    );
  }

  return (
    <>
      {currentView === 'list' ? (
        <ModelList
          modelName={modelName}
          onDetail={handleDetail}
          onModelDescLoaded={handleModelDescLoaded}
        />
      ) : currentRecord && modelDesc ? (
        <ModelDetail
          modelName={modelName}
          routeLabel={routeLabel}
          modelDesc={modelDesc}
          record={currentRecord}
          onBack={handleBackToList}
        />
      ) : (
        <div>
          Loading detail... currentRecord: {!!currentRecord}, modelDesc:{' '}
          {!!modelDesc}
        </div>
      )}
    </>
  );
};

export default ModelAdmin;
