import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { KanbanActionTypes } from './action';
import { KanbanState } from './reducer';
import { BoardActionTypes } from './Board/action';
import { CardInDetail } from './Card/CardInDetail';
import { Switch, Button, Divider, Form, Icon, Input, Layout, Modal, Popconfirm, Select, Row, Col } from 'antd';
import shortid from 'shortid';
import Board from './Board';
import styled from 'styled-components';
import TextArea from 'antd/es/input/TextArea';
import { SearchBar } from './SearchBar';
import { Overview } from './Board/Overview';
import { LabelButton } from '../../style/form';

const { Option } = Select;
const { Content } = Layout;

const Header = styled.div`
    position: relative;
    
    .header-right {
        position: absolute;
        top: 0px;
        right: 0px;
    }
`;

interface FormValue {
    name: string;
    description: string;
}

interface Props extends KanbanState, KanbanActionTypes, BoardActionTypes {
}

export const Kanban: FunctionComponent<Props> = (props: Props) => {
    const ref = useRef<Form>();
    const [visible, setVisible] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [editingBoardId, setEditingBoardId] = useState<string | undefined>('');
    const onShowTableChange = (value: boolean)=>{
        setShowTable(value);
    };
    const valueHandler: (values: FormValue) => void = ({ name, description }: FormValue) => {
        console.log(name, description, editingBoardId);
        if (editingBoardId === undefined) {
            props.addBoard(shortid.generate(), name, description);
        } else {
            // Edit board
            props.editBoard(editingBoardId, name, description);
        }
    };
    const handleSave = () => {
        if (ref.current === undefined) {
            return;
        }

        const form: any = ref.current.props.form;
        form.validateFields((err: Error, values: any) => {
            if (err) {
                throw err;
            }

            valueHandler(values);
            form.resetFields();
            setVisible(false);
        });
    };
    const handleCancel = () => {
        setVisible(false);
    };
    useEffect(() => {
        props.fetchBoards();
    }, []);

    const showConfigById = (id?: string) => {
        setEditingBoardId(id);
        setVisible(true);
        if (ref.current === undefined) {
            return;
        }

        const form: any = ref.current.props.form;
        if (id === undefined) {
            form.setFieldsValue(
                {
                    name: '',
                    description: ''
                },
                (err: Error) => {
                    if (err) throw err;
                }
            );
        } else {
            const board = props.boards[id];
            form.setFieldsValue(
                {
                    name: board.name,
                    description: board.description
                },
                (err: Error) => {
                    if (err) throw err;
                }
            );
        }
    };

    const addBoard = () => {
        showConfigById();
    };

    const overviewId = '31h89s190v-vg';
    const onSelectChange = (value: string) => {
        if (value === overviewId) {
            props.setChosenBoardId(undefined);
        } else {
            props.setChosenBoardId(value);
        }
    };

    const showBoardSettingMenu = () => {
        showConfigById(props.kanban.chosenBoardId);
    };

    const onDelete = () => {
        if (props.kanban.chosenBoardId) {
            props.deleteBoard(props.kanban.chosenBoardId)
        }

        setVisible(false);
    };

    const boardNameValidator = (name: string) => {
        return -1 === Object.values(props.boards).findIndex(v=>v.name === name);
    };

    return (
        <Layout style={{ padding: 4 }}>
            <Header>
                <Select
                    onChange={onSelectChange}
                    value={props.kanban.chosenBoardId}
                    style={{
                        width: 200
                    }}
                    placeholder={'Choose your board'}
                >
                    <Option value={overviewId} key={overviewId}>
                        [Overview]
                    </Option>
                    {Object.values(props.boards).map(v => {
                        return (
                            <Option value={v._id} key={v._id}>
                                {v.name}
                            </Option>
                        );
                    })}
                </Select>
                <Button style={{paddingLeft: 10, paddingRight: 10}} onClick={addBoard}>
                    <Icon type={'plus'}/>
                </Button>
                <div className='header-right'>
                    {
                        props.kanban.chosenBoardId ? (
                            <Button shape={'circle'} icon={'setting'} onClick={showBoardSettingMenu}/>
                        ) : (
                            <LabelButton>
                                <label>Show Table: </label>
                                <Switch onChange={onShowTableChange} checked={showTable}/>
                            </LabelButton>
                        )
                    }

                </div>
            </Header>
            <Content
                style={{
                    padding: 4,
                    height: 'calc(100vh - 45px)'
                }}
            >
                {props.kanban.chosenBoardId === undefined ? (
                    <Overview showConfigById={showConfigById} showTable={showTable}/>
                ) : (
                    <Board boardId={props.kanban.chosenBoardId} key={props.kanban.chosenBoardId}/>
                )}
            </Content>
            {
                // @ts-ignore
                <EditKanbanForm
                    wrappedComponentRef={ref}
                    visible={visible}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isCreating={!editingBoardId}
                    onDelete={onDelete}
                    nameValidator={boardNameValidator}
                />
            }
            <CardInDetail/>
            <SearchBar/>
        </Layout>
    );
};

interface FormProps {
    onSave?: any;
    onCancel?: any;
    form: any;
    visible: boolean;
    isCreating: boolean;
    onDelete: ()=>void;
    nameValidator: (name: string)=>boolean;
}

const EditKanbanForm = Form.create({ name: 'form_in_modal' })(
    class extends React.Component<FormProps> {
        validator = (rule: any, name: string, callback: Function) => {
            if (this.props.nameValidator(name)) {
                callback();
                return;
            }

            callback(`Board "${name}" already exists`)
        };

        render() {
            const { visible, onCancel, onSave, form, isCreating, onDelete } = this.props;
            const { getFieldDecorator } = form;
            return (
                <Modal
                    visible={visible}
                    title={isCreating ? 'Create a new board' : 'Edit'}
                    okText={isCreating ? 'Create' : 'Save'}
                    onCancel={onCancel}
                    onOk={onSave}
                >
                    <Form layout="vertical">
                        <Form.Item label="Name">
                            {getFieldDecorator('name', {
                                rules: [
                                    { required: true, message: 'Please input the name of board!' },
                                    { max: 24, message: 'Max length of name is 24'},
                                    { validator: this.validator}
                                ]
                            })(<Input/>)}
                        </Form.Item>
                        <Form.Item label="Description">
                            {getFieldDecorator('description')(
                                <TextArea autosize={{ minRows: 3, maxRows: 5 }}/>
                            )}
                        </Form.Item>
                        {
                            !isCreating? (
                                <Form.Item>
                                    <Popconfirm title={'Are you sure?'} onConfirm={onDelete}>
                                        <Button shape={'circle'} type={'danger'} icon={'delete'}/>
                                    </Popconfirm>
                                </Form.Item>
                            ) : undefined
                        }
                    </Form>
                </Modal>
            );
        }
    }
);