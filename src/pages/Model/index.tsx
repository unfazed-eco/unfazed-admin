import { PageContainer } from '@ant-design/pro-components';

import { model_desc } from '@/services/model';
import React from 'react';

const Model: React.FC = () => {
  const [modelName, setModelName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchName = async () => {
      try {
        const resp = await model_desc('abc');
        if (!resp) {
          throw new Error('No response from model_desc');
        }
        setModelName(resp.data.name);
      } catch (error) {
        console.error(error);
      }
    };

    fetchName();
  }, []);

  return (
    <PageContainer>
      <p>{modelName ? modelName : 'Loading...'}</p>
    </PageContainer>
  );
};

export default Model;
