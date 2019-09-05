import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Row, Select, Statistic } from 'antd';
import { HistoryActionCreatorTypes } from './action';
import { GridCalendar } from '../Visualization/GridCalendar';
import styled from 'styled-components';
import { DualPieChart, PomodoroDualPieChart } from '../Visualization/DualPieChart';
import { RootState } from '../../reducers';
import {
    AggPomodoroInfo,
    getAggPomodoroInfo,
    getPomodoroCalendarData,
    getPomodoroCount,
    TimeSpentData
} from './op';
import { AsyncWordCloud, WordCloud } from '../Visualization/WordCloud';
import { PomodoroRecord } from '../../monitor/type';
import { KanbanBoardState } from '../Kanban/Board/action';
import { workers } from '../../workers';

const { Option } = Select;

const Container = styled.div`
    max-width: 1200px;
    margin: 10px auto;
    padding: 20px;
`;

interface Props extends HistoryActionCreatorTypes {
    chosenId?: string;
    boards: KanbanBoardState;
}

export const History: React.FunctionComponent<Props> = (props: Props) => {
    const [aggInfo, setAggInfo] = useState<AggPomodoroInfo>({
        count: {
            day: 0,
            month: 0,
            week: 0
        },
        calendarCount: 0,
        pieChart: {
            appData: [],
            projectData: []
        },
        wordWeights: []
    });
    const container = useRef<HTMLDivElement>();
    const [calendarWidth, setCalendarWidth] = useState(800);

    const resizeEffect = () => {
        const setWidth = () => {
            const w = !container.current
                ? 800
                : container.current.clientWidth > 1060
                ? 1000
                : container.current.clientWidth - 60;
            setCalendarWidth(w);
        };
        setWidth();
        window.addEventListener('resize', setWidth);
        return () => {
            window.removeEventListener('resize', setWidth);
        };
    };

    useEffect(resizeEffect, []);
    useEffect(() => {
        if (props.chosenId === undefined) {
            workers.dbWorkers.sessionDB
                .find({}, {})
                .then(docs => {
                    return getAggPomodoroInfo(docs);
                })
                .then((ans: AggPomodoroInfo) => {
                    setAggInfo(ans);
                });
        } else {
            workers.dbWorkers.sessionDB
                .find({ boardId: props.chosenId }, {})
                .then(docs => {
                    return getAggPomodoroInfo(docs);
                })
                .then((ans: AggPomodoroInfo) => {
                    setAggInfo(ans);
                });
        }
    }, [props.chosenId]);

    const onChange = (v: string) => {
        props.setChosenProjectId(v);
    };

    const onProjectClick = (name: string) => {
        const v = Object.values(props.boards).find(v => v.name === name);
        if (v) {
            props.setChosenProjectId(v._id);
        }
    };

    return (
        // @ts-ignore
        <Container ref={container}>
            <Row style={{ marginBottom: 20 }}>
                <Select
                    onChange={onChange}
                    value={props.chosenId}
                    style={{ width: 200 }}
                    placeholder={'Set Project Filter'}
                >
                    <Option value={undefined} key="All Projects">
                        All Projects
                    </Option>
                    {Object.values(props.boards).map(v => {
                        return (
                            <Option value={v._id} key={v._id}>
                                {v.name}
                            </Option>
                        );
                    })}
                </Select>
            </Row>
            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros Today"
                            value={aggInfo.count.day}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros This Week"
                            value={aggInfo.count.week}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros This Month"
                            value={aggInfo.count.month}
                            precision={0}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>
            {calendarWidth > 670 ? (
                <React.Fragment>
                    <GridCalendar data={aggInfo.calendarCount} width={calendarWidth} />
                    <DualPieChart
                        {...aggInfo.pieChart}
                        width={calendarWidth}
                        onProjectClick={onProjectClick}
                    />
                    <WordCloud
                        weights={aggInfo.wordWeights}
                        width={calendarWidth}
                        height={calendarWidth * 0.6}
                    />
                </React.Fragment>
            ) : (
                undefined
            )}
        </Container>
    );
};
