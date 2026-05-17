function meetingsConflict(
    a,
    b
) {

    if (
        a.day !== b.day
    ) {

        return false;
    }

    return (

        a.startMinutes <
        b.endMinutes

        &&

        b.startMinutes <
        a.endMinutes
    );
}

function sectionsConflict(
    sectionA,
    sectionB
) {

    if (
        sectionA.term !==
        sectionB.term
    ) {

        return false;
    }

    for (
        const meetingA of
        sectionA.meetings
    ) {

        for (
            const meetingB of
            sectionB.meetings
        ) {

            if (

                meetingsConflict(
                    meetingA,
                    meetingB
                )
            ) {

                return true;
            }
        }
    }

    return false;
}

