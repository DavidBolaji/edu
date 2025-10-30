import { Menu } from 'antd';
import styled from 'styled-components';

export const MenuStyled = styled(Menu)`
  && {
    background-color: #2563eb;

    .ant-menu-title-content {
      color: white;
      margin-left: 14px !important;
      font-weight: 500;
    }

    .ant-menu-item-icon {
      color: white;
    }

    .ant-menu-item.ant-menu-item-selected {
      background-color: #000;
      width: 88%;
      border-radius: 0px;
      border-left: 4px solid white;
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;

      > * {
        margin-left: -5px;
      }
    }

    .ant-menu-item.ant-menu-item-selected > * {
      color: white !important;
      font-weight: 400;
      font-size: 16px;
      line-height: 24px;
    }

    .ant-menu-item.ant-menu-item-selected > .ant-menu-item-icon {
      color: white !important;
    }

    .ant-menu-item.ant-menu-item-active {
      background-color: #000 !important; /** sidebar bg hover **/
      border-radius: 0px;
      width: 88%;
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;
    }

    .ant-menu-item.ant-menu-item-active > * {
      color: white !important;
      border-radius: 0px;
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;
    }

    > * {
      padding-left: 26px !important;
      margin-bottom: 16px !important;
      margin: 0px;
      height: 48px;
      width: 88%;
    }
  }
`;
